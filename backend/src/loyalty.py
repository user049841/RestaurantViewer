from psycopg2.extensions import connection
from string import ascii_letters, digits
from random import choices

from src.profile import validate_diner, validate_eatery


def edit_loyalty_system(db: connection, eatery_id: int, enabled: bool, loyalty_type: str,
                        item: str, point_goal: str, description: str) -> dict:
    """When passed valid arguments, updates the loyalty system
    for an eatery to the given details.

    Arguments:
        db           (psycopg2.connection) - A connection to a database.
        eatery_id    (int)   - The id of the eatery.
        enabled      (bool)  - Whether the loyalty system is enabled.
        loyalty_type (str)   - The loyalty system type.
        item         (str)   - The relevant menu item for the loyalty system.
        point_goal   (str)   - The number of points needed for a loyalty reward.
        description  (str)   - The description of the loyalty system.

    Exceptions:
        AccessError - Is raised when the following occurs:
            - The token of the user is invalid.
        InputError - Is raised when the following occurs:
            - The user is not an eatery.

    Return Value:
        Returns an empty dict.
    """
    validate_eatery(db, eatery_id)
    query = """
    update loyalty_system
    set enabled = %s, type = %s, item = %s, point_goal = %s, description = %s
    where eatery_id = %s
    """
    cur = db.cursor()
    cur.execute(query, [enabled, loyalty_type, item, point_goal, description, eatery_id])
    db.commit()
    cur.close()
    return {}


def obtain_loyalty_voucher(db: connection, diner_id: int, eatery_id: int) -> dict:
    """Given a diner and eatery, creates a corresponding voucher code.
    Resets the diner's loyalty points for that eatery to 0.

    Arguments:
        diner_id    (str)   - The id of the diner redeeming the loyalty reward.
        eatery_id   (int)   - The id of the eatery whose reward is being redeemed.

    Exceptions:
        InputError - Is raised when the following occurs:
            - The diner_id does not refer to a valid diner.
            - The eatery_id does not refer to a valid eatery.

    Return Value:
        Returns a dict containing the voucher code.
    """
    validate_eatery(db, eatery_id)
    validate_diner(db, diner_id)
    query = """
    select type, item from loyalty_system
    where eatery_id = %s
    """
    cur = db.cursor()
    cur.execute(query, [eatery_id])
    loyalty_type, item = cur.fetchone()

    query = """
    insert into loyalty_vouchers (eatery_id, type, item)
    values
    (%s, %s, %s)
    returning id;
    """
    cur.execute(query, [eatery_id, loyalty_type, item])
    voucher_id = cur.fetchone()[0]

    query = """
    update diners
    set points = jsonb_set(points, '{%s}', '0'::jsonb)
    where id = %s
    """
    cur.execute(query, [eatery_id, diner_id])
    code = create_loyalty_code(db, voucher_id, diner_id)
    db.commit()
    cur.close()
    return {"code": code}


def view_loyalty_vouchers(db: connection, diner_id: int) -> list:
    """Given a diner, view the diner's loyalty vouchers.

    Arguments:
        diner_id    (int)   - The id of the diner to view the loyalty vouchers of.

    Exceptions:
        InputError - Is raised when the following occurs:
            - The token does not refer to a diner.

    Return Value:
        Returns a list of dictionaries of the diner's vouchers.
    """
    validate_diner(db, diner_id)
    query = """
        select eatery_id, eatery_name, type, item, code
        from loyalty_vouchers v
        join voucher_codes c on (v.id = c.loyalty_voucher_id)
        join eateries e on (v.eatery_id = e.id)
        where diner_id = %s
    """
    cur = db.cursor()
    cur.execute(query, [diner_id])
    results = cur.fetchall()
    cur.close()

    vouchers = []
    for voucher in results:
        vouchers.append(
            {
                'eatery_id': voucher[0],
                'eatery_name': voucher[1],
                'type': voucher[2],
                'item': voucher[3],
                'code': voucher[4]
            }
        )
    return vouchers


def create_loyalty_code(db: connection, voucher_id: int, diner_id: int) -> str:
    create_voucher_code = """
        INSERT INTO voucher_codes (code, loyalty_voucher_id, diner_id)
        VALUES (%s, %s, %s)
    """

    ch = ascii_letters + digits
    length = 6
    gen_code = ''.join(choices(ch, k=length)) + str(diner_id) + str(voucher_id)
    cur = db.cursor()
    cur.execute(create_voucher_code, [gen_code, voucher_id, diner_id])
    db.commit()
    cur.close()
    return gen_code


def increment_loyalty_points(db: connection, diner_id: int, eatery_id: int) -> None:
    """Increments the loyalty points of a diner for an eatery.
    Exits if the eatery's loyalty system is disabled.
    Assumes the diner and eatery exist
    """
    cur = db.cursor()
    query = """
    select enabled from loyalty_system
    where eatery_id = %s
    """
    cur.execute(query, [eatery_id])
    if not cur.fetchone()[0]:
        return

    query = """
    update diners
    set points =
        case
            when points ? '%s' then jsonb_set(points, '{%s}', to_jsonb((points->'%s')::int + 1))
            else jsonb_set(points, '{%s}', '1')
        end
    where id = %s
    """
    cur.execute(query, [eatery_id, eatery_id, eatery_id, eatery_id, diner_id])
    cur.close()
    db.commit()
