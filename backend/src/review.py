"""Contains the functions related to reviews and ratings of eateries
"""
from psycopg2.extensions import cursor, connection
from src.profile import validate_eatery

from src.error import AccessError
from src.error import InputError

from src.loyalty import increment_loyalty_points

def create_review(db: connection, user_id: int, rating: str, title: str,
                  description: str, eatery_id: int, timestamp: str) -> dict:
    """Given a review, updates the eatery to add the review.

    Arguments:
        db          (psycopg2.connection) - A connection to a database
        user_id     (int)   - The id of the user that made the review.
        rating      (str)   - A rating from 0.5 to 5.0 in increments of 0.5.
        title       (str)   - The title of the review.
        description (str)   - The review contents.
        eatery_id   (int)   - The id of the eatery being reviewed.
        timestamp   (str)   - A timestamp of when the review was made.

    Exceptions:
        InputError - Is raised when the following occurs
            - The eatery_id is invalid.
            - The rating is invalid.

    Return Value:
        Returns an empty dictionary.
    """
    validate_eatery(db, eatery_id)
    if rating == '':
        raise InputError("Invalid rating.")

    # Checks if the user has made previous reviews before incrementing
    # their loyalty points for the eatery they are reviewing.
    if not has_prior_reviews(db, user_id, eatery_id):
        increment_loyalty_points(db, user_id, eatery_id)

    cur = db.cursor()
    query = """
        INSERT INTO reviews (eatery_id, rating, title, description, date, user_id)
        VALUES
    (%s, %s, %s, %s, %s, %s)
    """
    cur.execute(query, [eatery_id, float(rating), title, description, timestamp, user_id])
    db.commit()

    get_tags_w_name = """
        SELECT tags, eatery_name
        FROM eateries
        WHERE id = %s
    """

    add_tags = """
        UPDATE diners
        SET recommend_tags = ARRAY_CAT(recommend_tags, %s), visited = ARRAY_APPEND(visited, %s)
        WHERE id = %s
    """

    cur.execute(get_tags_w_name, [eatery_id])
    result = cur.fetchone()
    if result:
        tags = result[0]
        eatery = result[1]
        if float(rating) < 3.5 or tags == None:
            tags = []
        cur.execute(add_tags, [tags, eatery, int(user_id)])
        db.commit()

    cur.close()
    return {}


def has_prior_reviews(db: connection, user_id: int, eatery_id: int) -> bool:
    """Checks if the user has made previous reviews for an eatery.
    If not, stores the fact that they made a review.

    Arguments:
        db          (psycopg2.connection) - A connection to a database
        user_id     (int) - The id of the user reviewing.
        eatery_id   (int) - The id of the eatery reviewed.

    Return Value:
        Returns a boolean representing if the user has made prior reviews.
    """

    cur = db.cursor()
    query = """
        SELECT %s = any(reviewed)
        FROM eateries
        WHERE id = %s;
    """
    cur.execute(query, [user_id, eatery_id])
    if cur.fetchone()[0]:
        cur.close()
        return True

    query = """
        UPDATE eateries
        SET reviewed = reviewed || %s
        WHERE id = %s
    """
    cur.execute(query, [user_id, eatery_id])
    db.commit()
    cur.close()
    return False


def edit_review(db: connection, review_id: int, user_id: int, rating: str,
                title: str, description: str):
    """When given a valid review_id, user_id, and review, edits the review
    to become the new review.

    Arguments:
        db          (psycopg2.connection) - A connection to a database
        review_id   (int)   - The id of the review.
        user_id     (str)   - The id of the user requesting to edit.
        rating      (float) - The rating the user is giving.
        title       (str)   - The title of the review.
        description (str)   - The review contents.

    Exceptions:
        AccessError - Is raised when the following occurs:
            - The stored user_id for the review does not match user_id.
        InputError - Is raised when the following occurs:
            - The review_id is not valid.
            - The rating is invalid.

    Return Value:
        Returns an empty dictionary.
    """
    if rating == '' and not get_parent_id(db, review_id):
        raise InputError("Invalid rating.")
    validate_user_review(db, user_id, review_id)
    query = """
    update reviews
    set rating = %s, title = %s, description = %s, edited = TRUE
    where id = %s
    """
    cur = db.cursor()
    rating = float(rating) if rating else None
    cur.execute(query, [rating, title, description, review_id])
    db.commit()
    cur.close()
    return {}


def delete_review(db: connection, review_id: int, user_id: int) -> dict:
    """When given a valid user_id and review_id, deletes the
    corresponding review.
    Arguments:
        user_id     (str) - The id of the user requesting to delete the review.
        review_id   (int) - The id of the review to delete.
    Exceptions:
        AccessError - Is raised when the following occurs:
            - The user_id does not match to the user that made the review.
        InputError - Is raised when the following occurs:
            - The review_id is invalid.
    Return Value:
        Returns an empty dictionary.
    """
    validate_user_review(db, user_id, review_id)
    cur = db.cursor()
    if has_children(db, review_id):
        mark_as_deleted = """
        update reviews
        set deleted = TRUE
        where id = %s
        """
        cur.execute(mark_as_deleted, [review_id])
        db.commit()
        cur.close()
        return {}

    parent_id = get_parent_id(db, review_id)
    query = """
    delete from reviews
    where id = %s
    """
    cur.execute(query, [review_id])

    while parent_id:
        if has_children(db, parent_id) or not marked_as_deleted(db, parent_id):
            break
        review_id = parent_id
        parent_id = get_parent_id(db, review_id)
        query = """
        delete from reviews
        where id = %s
        """
        cur.execute(query, [review_id])

    db.commit()
    cur.close()
    return {}


def get_parent_id(db: connection, review_id: int) -> int:
    query = """
    select parent_id from reviews
    where id = %s
    """
    cur = db.cursor()
    cur.execute(query, [review_id])
    results = cur.fetchone()
    parent_id = results[0] if results else None
    cur.close()
    return parent_id


def has_children(db: connection, parent_id: int) -> bool:
    query = """
    select 1
    from reviews
    where parent_id = %s
    limit 1
    """
    cur = db.cursor()
    cur.execute(query, [parent_id])
    has_children = bool(cur.fetchall())
    cur.close()
    return has_children


def marked_as_deleted(db: connection, review_id: int) -> bool:
    query = """
    select deleted
    from reviews
    where id = %s
    """
    cur = db.cursor()
    cur.execute(query, [review_id])
    results = cur.fetchone()[0]
    cur.close()
    return results


def validate_user_review(db: connection, user_id: int, review_id: int) -> None:
    query = """
    select user_id from reviews
    where id = %s
    """
    cur = db.cursor()
    cur.execute(query, [review_id])
    results = cur.fetchone()
    if not results:
        cur.close()
        raise InputError(description='Invalid review id.')
    if results[0] != user_id:
        cur.close()
        raise AccessError(description='Invalid user id.')


def create_reply(db: connection, user_id: int, description: str,
                 review_id: int, eatery_id: int, timestamp: str) -> dict:
    """Given a reply to a review, updates the database to add the reply.

    Arguments:
        db          (psycopg2.connection) - A connection to a database
        user_id     (int)   - The id of the user that made the reply.
        description (str)   - The reply contents.
        review_id   (int)   - The id of the review being replied to.
        eatery_id   (int)   - The id of the eatery the reply is relevant to.
        timestamp   (str)   - A timestamp of when the reply was made.

    Exceptions:
        AccessError - Is raised when the following occurs:
            - The user_id does not match the user_id that made the review.
        InputError - Is raised when the following occurs:
            - The eatery_id is invalid.
            - The review_id is invalid.
            - Making the reply would result in 5 nested replies.

    Return Value:
        Returns an empty dictionary.
    """
    validate_eatery(db, eatery_id)
    cur = db.cursor()
    query = """
    select parent_id from reviews
    where id = %s
    """
    cur.execute(query, [review_id])
    next_id = cur.fetchone()
    if not next_id:
        cur.close()
        raise InputError(description='Review does not exist.')
    i = 1
    while next_id and next_id[0] != None:
        cur.execute(query, [next_id[0]])
        next_id = cur.fetchone()
        if i == 5:
            cur.close()
            raise InputError(description='Too many nested replies.')
        i += 1

    query = """
    insert into reviews (eatery_id, parent_id, description, date, user_id)
    values
    (%s,  %s, %s, %s, %s)
    """
    cur.execute(query, [eatery_id, review_id, description, timestamp, user_id])
    db.commit()
    cur.close()
    return {}


def get_reviews(db: connection, eatery_id: int) -> dict:
    """
    When given a valid eatery_id, fetches the reviews for the
    corresponding eatery.

    Arguments:
        eatery_id   (int)   - The id of the eatery to fetch reviews for.

    Exceptions:
        InputError - Is raised when the following occurs:
            - The eatery_id is invalid.

    Returns:
        Returns a dictionary of the reviews.
    """
    validate_eatery(db, eatery_id)
    cur = db.cursor()
    reviews = get_replies(cur, None, eatery_id)
    query = """
    SELECT get_avg_rating(%s)
    """
    cur.execute(query, [eatery_id])
    rating = cur.fetchone()[0]
    cur.close()
    return {'reviews': reviews, 'rating': float(rating)}


def get_replies(cursor: cursor, review_id: int, eatery_id: int) -> list:
    query = """
    select reviews.id, rating, title, reviews.description, date, edited,
    deleted, user_id, COALESCE(diners.avatar, eateries.avatar), COALESCE(username, eatery_name)
    from reviews
    left join diners on (reviews.user_id = diners.id)
    left join eateries on (reviews.user_id = eateries.id)
    where (parent_id = %s or (COALESCE(%s, 0) = 0 and COALESCE(parent_id, 0) = 0))
    and eatery_id = %s
    """
    cursor.execute(query, [review_id, review_id, eatery_id])
    replies = cursor.fetchall()
    all_replies = []
    for reply in replies:
        all_replies.append({
            'id': reply[0],
            'rating': float(reply[1]) if reply[1] else reply[1],
            'title': reply[2],
            'description': reply[3],
            'date': reply[4],
            'edited': reply[5],
            'deleted': reply[6],
            'user_id': reply[7],
            'avatar': reply[8],
            'username': reply[9],
            'replies': get_replies(cursor, reply[0], eatery_id)
        })
    return all_replies
