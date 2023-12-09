"""Contains the functions related to eatery management
"""
from psycopg2.extensions import connection

from src.error import AccessError
from src.error import InputError
from math import asin, sin, cos, sqrt, radians

DATE_FORMAT = '%d-%m-%Y %H:%M:%S'

# Diners

"""When given valid details, updates user's profile details with given inputs"""
def diner_update_details(db: connection, diner_id: str, email: str, name: str, avatar: str) -> dict:
    set_details = """
        UPDATE diners
        SET email = %s, username = %s, avatar = %s
        WHERE id = %s
    """

    cur = db.cursor()
    cur.execute(set_details, [email, name, avatar, int(diner_id)])
    db.commit()
    cur.close()
    return {}


"""When given valid diner id, retrieves and returns user's profile details"""
def diner_get_details(db: connection, diner_id: str) -> dict:
    get_details = """
        SELECT *
        FROM diners
        WHERE id = %s
    """
    cur = db.cursor()
    cur.execute(get_details, [int(diner_id)])
    result = cur.fetchone()
    cur.close()
    return {
        'diner': {
            'email': result[1],
            'name': result[2],
            'avatar': result[4],
            'recommend_tags': result[5],
            'visited': result[6],
            'blacklist': result[7],
            'points': result[8]
        }
    }

"""When given a valid eatery id, adds this eatery id to the diner's
   blacklist of eateries (block eatery from popping up in recommendations)
"""
def diner_blacklist_eatery(db: connection, diner_id: str, eatery_id: str):
    add_blacklist = """
        UPDATE diners
        SET blacklist = ARRAY_APPEND(blacklist, %s)
        WHERE id = %s
    """

    cur = db.cursor()
    cur.execute(add_blacklist, [int(eatery_id), int(diner_id)])
    db.commit()
    cur.close()
    return {}

# Eateries


"""When given valid details, updates user's profile details with given inputs"""
def eatery_update_details(db: connection, eatery_id: str, email: str, name: str, desc: str,
                          contact: str, address: str, avatar: str, images: list[str], pricing: str,
                          tags: list[str], latitude: str, longitude: str) -> dict:
    if latitude:
        latitude = round(float(latitude), 6)
    if longitude:
        longitude = round(float(longitude), 6)
    if len(contact) > 10:
        raise InputError(description="Phone number is too long")

    set_details = """
        UPDATE eateries
        SET email = %s, eatery_name = %s, description = %s, address = %s, phone_number = %s,
        avatar = %s, images = %s, pricing = %s, tags = %s, latitude = %s, longitude = %s
        WHERE id = %s
    """

    cur = db.cursor()
    cur.execute(set_details, [email, name, desc, address, contact, avatar,
                              images, pricing, tags, latitude, longitude, int(eatery_id)])
    db.commit()
    cur.close()
    return {}


"""When given valid eatery id and menu, updates the user's menu to the given menu"""
def eatery_update_menu(db: connection, token_dict: dict, eatery_id: str, menu: list) -> dict:
    eatery_id = int(eatery_id)
    if token_dict['user_id'] != eatery_id:
        raise AccessError(description='Token does not correspond to eatery.')

    validate_eatery(db, eatery_id)
    delete_menu = """
    DELETE
    FROM menu_items
    WHERE eatery_id = %s
    """
    cur = db.cursor()
    cur.execute(delete_menu, [eatery_id])

    for entry in menu:
        category = entry['name']
        add_to_menu = """
            insert into menu_items (eatery_id, item_name, category, price, vegan, gluten_free)
            values (%s, %s, %s, %s, %s, %s)
            """
        if not entry['items']:
            cur.execute(add_to_menu, [eatery_id, None,
                        category, None, None, None])
        for item in entry['items']:
            try:
                item['price'] = round(float(item['price']), 2)
            except:
                raise InputError(description='Invalid price')
            if '.' in str(item['price']) and str(item['price']).index('.') > 5:
                raise InputError(description='Invalid price')

            cur.execute(add_to_menu, [eatery_id, item['name'], category,
                                      item['price'], item['vegan'], item['gluten_free']])
    db.commit()
    cur.close()
    return {}


"""When given valid eatery id, retrieves and returns user's profile details"""
def eatery_get_details(db: connection, eatery_id: str, latitude: str, longitude: str) -> dict:
    get_details = """
        SELECT *
        FROM eateries
        WHERE id = %s
    """
    cur = db.cursor()
    cur.execute(get_details, [int(eatery_id)])
    result = cur.fetchone()

    get_rating = """
        SELECT get_avg_rating(%s);
    """
    cur.execute(get_rating, [int(eatery_id)])
    rating = float(cur.fetchone()[0])

    get_vouchers = """
        SELECT *
        FROM vouchers
        WHERE eatery_id = %s AND num_vouchers > 0
    """
    cur.execute(get_vouchers, [int(eatery_id)])
    vouchers_res = cur.fetchall()
    vouchers = []
    for voucher in vouchers_res:
        vouchers.append(
            {
                'id': voucher[0],
                'name': voucher[2],
                'description': voucher[3],
                'discount': voucher[4],
                'num_vouchers': voucher[5],
                'start': voucher[6].strftime(DATE_FORMAT),
                'end': voucher[7].strftime(DATE_FORMAT)
            }
        )

    get_loyalty_system = """
        SELECT *
        FROM loyalty_system
        WHERE eatery_id = %s
    """
    cur.execute(get_loyalty_system, [int(eatery_id)])
    loyalty_system = cur.fetchone()
    cur.close()
    return {
        'eatery': {
            'id': result[0],
            'name': result[1],
            'email': result[2],
            'address': result[4],
            'phone_number': result[5],
            'description': result[6],
            'avatar': result[7],
            'images': result[8],
            'pricing': result[9],
            'tags': result[10],
            'rating': rating,
            'vouchers': vouchers,
            'distance': str(get_distance(db, int(eatery_id), latitude, longitude)),
            'latitude': str(result[11]),
            'longitude': str(result[12]),
            'reviewed_by': result[13],
            'loyalty_system': loyalty_system
        }
    }


"""Returns distance between coordinates and an eatery"""
def get_distance(db: connection, eatery_id: int, lat1: str, long1: str) -> float:
    if not lat1 or not long1:
        return -1

    lat1 = radians(round(float(lat1), 6))
    long1 = radians(round(float(long1), 6))
    get_coords = """
    SELECT latitude, longitude
    FROM eateries
    WHERE id = %s
    """
    cur = db.cursor()
    cur.execute(get_coords, [eatery_id])
    lat2, long2 = cur.fetchall()[0]
    if not lat2 or not long2:
        return -1
    lat2 = radians(lat2)
    long2 = radians(long2)

    return (2 * 6371 *
            asin(
                sqrt(
                    (sin((lat2 - lat1) / 2) ** 2) +
                    cos(lat1) * cos(lat2) * ((sin((long2 - long1) / 2)) ** 2)
                )
            )
            )


"""When given valid eatery id, retrieves and returns user's menu"""
def eatery_get_menu(db: connection, eatery_id: str) -> dict:
    eatery_id = int(eatery_id)
    validate_eatery(db, eatery_id)
    get_menu = """
        SELECT category, jsonb_agg(jsonb_build_object(
            'name', item_name,
            'price', price,
            'vegan', vegan,
            'gluten_free', gluten_free,
            'id', id
        )) AS items
        FROM menu_items
        WHERE eatery_id = %s
        GROUP BY category
        ORDER BY min(id)
    """
    cur = db.cursor()
    cur.execute(get_menu, [eatery_id])
    menu_items = []
    for category, items in cur.fetchall():
        if any(item is None for item in items[0].values()):
            items = []
        for item in items:
            item.pop('id')
        menu_items.append({"name": category, "items": items})
    cur.close()
    return menu_items


"""Returns info about all eateries"""
def eatery_get_all_eateries(db: connection, latitude: str, longitude: str) -> list:
    get_all = """
        SELECT id, eatery_name, email, address,
        phone_number, description, avatar, images, pricing, tags, get_avg_rating(id),
            (
                SELECT count(*) from reviews
                where reviews.eatery_id = eateries.id
                and reviews.parent_id IS NULL
                and reviews.deleted = FALSE
            ),
            (
                SELECT SUM(num_vouchers)
                FROM vouchers v
                WHERE v.eatery_id = eateries.id
            )
        FROM eateries
    """
    cur = db.cursor()
    cur.execute(get_all)
    results = cur.fetchall()

    eateries = []
    for result in results:
        eateries.append(
            {
                'id': result[0],
                'name': result[1],
                'email': result[2],
                'address': result[3],
                'phone_number': result[4],
                'description': result[5],
                'avatar': result[6],
                'images': result[7],
                'pricing': result[8],
                'tags': result[9],
                'rating': float(result[10]),
                'num_reviews': result[11],
                'num_vouchers': result[12],
                'distance': get_distance(db, result[0], latitude, longitude)
            }
        )
    cur.close()
    return eateries


def eatery_get_all_tags(db: connection) -> str:
    """Gets the union of all tags for all eateries.

    Arguments:
        db  (psycopg2.connection) - A connection to a database

    Return Value:
        Returns a dictionary containing a
        list of all tags.
    """
    cur = db.cursor()
    query = """
    select array_agg(distinct tag)
    from eateries, unnest(tags) as tag
    """
    cur.execute(query)
    tags = cur.fetchall()[0][0]
    if tags is None:
        tags = []
    cur.close()
    return {'tags': tags}


"""Raises an InputError if the provided eatery_id is invalid."""
def validate_eatery(db: connection, eatery_id: int) -> None:
    validation_query = """
        SELECT id
        FROM eateries
        WHERE id = %s
    """
    cur = db.cursor()
    cur.execute(validation_query, [eatery_id])
    if not cur.fetchall():
        cur.close()
        raise InputError(description='Invalid eatery id.')
    cur.close()


def validate_diner(db: connection, diner_id: int) -> None:
    validation_query = """
        SELECT id
        FROM diners
        WHERE id = %s
    """
    cur = db.cursor()
    cur.execute(validation_query, [diner_id])
    if not cur.fetchall():
        cur.close()
        raise InputError(description='Invalid diner id.')
    cur.close()
