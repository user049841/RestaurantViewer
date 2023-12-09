# functions for handling vouchers
from psycopg2.extensions import connection, cursor
from datetime import datetime
from string import ascii_letters, digits
from random import choices

from src.loyalty import increment_loyalty_points

from src.error import InputError

DATE_FORMAT = '%d-%m-%Y %H:%M:%S'

"""Helper function for create schedule vouchers - scheduled vouchers do not contain
    a date (only a time)"""
def create_datetime(time: str):
    return datetime.now().date().strftime('%d-%m-%Y') + ' ' + time

""" Given valid inputs for creating a voucher, creates the voucher and stores it in the database
    This function is used to create vouchers for weekly voucher scheduling. 
    Exceptions are raised if the start date is earlier than the current date, or if the number
    of vouchers given is less than 1."""
def create_vouchers(db: connection, eatery_id: str, name: str, desc: str, discount: str, num_vouchers: str, start: str, end: str):
    create_primary_voucher = """
        INSERT INTO vouchers (eatery_id, name, description, discount_rate, num_vouchers, start_date, end_date)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    """

    try:
        start_date = datetime.strptime(start, DATE_FORMAT)
        end_date = datetime.strptime(end, DATE_FORMAT)
    except ValueError:
        # creating scheduled voucher (no date)
        start_date = datetime.strptime(create_datetime(start), DATE_FORMAT)
        end_date = datetime.strptime(create_datetime(end), DATE_FORMAT)

    # user input checking
    if end_date < datetime.now():
        raise InputError(description='End time must be later than the time right now')
    
    try:
        if int(num_vouchers) < 1:
            raise InputError(description='Number of vouchers must be greater than 0')
    except ValueError:
        raise InputError(description='Missing number of vouchers')

    cur = db.cursor()
    cur.execute(create_primary_voucher, [int(eatery_id), name, desc, discount, int(num_vouchers), start_date, end_date])
    db.commit()
    cur.close()
    return {}

"Returns a list of vouchers (and all voucher fields) associated with given diner ID"
def diner_view_vouchers(db: connection, diner_id: str):
    get_vouchers = """
        SELECT v.id, name, discount_rate, v.description, start_date, end_date, code, eatery_name, eatery_id
        FROM vouchers v
        JOIN voucher_codes c
        ON (v.id = c.voucher_id)
        JOIN eateries e
        ON (v.eatery_id = e.id)
        WHERE diner_id = %s
    """

    cur = db.cursor()
    cur.execute(get_vouchers, [int(diner_id)])
    vouchers_res = cur.fetchall()
    cur.close()

    vouchers = []
    for voucher in vouchers_res:
        vouchers.append(
            {
                'id': voucher[0],
                'name': voucher[1],
                'discount_rate': voucher[2],
                'description': voucher[3],
                'start_date': voucher[4].strftime(DATE_FORMAT),
                'end_date': voucher[5].strftime(DATE_FORMAT),
                'code': voucher[6],
                'eatery_name': voucher[7],
                'eatery_id': voucher[8]
            }
        )

    return vouchers

"Get all primary vouchers and schedules associated with given eatery ID"
def get_vouchers_and_schedules(db: connection, eatery_id: str):
    get_vouchers = """
        SELECT *
        FROM vouchers
        WHERE eatery_id = %s AND num_vouchers > 0
    """

    cur = db.cursor()
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

    get_schedules = """
        SELECT *
        FROM discountschedule
        WHERE eatery_id = %s
    """

    cur.execute(get_schedules, [int(eatery_id)])
    schedules_res = cur.fetchall()
    cur.close()

    schedules = []
    for schedule in schedules_res:
        schedules.append(
            {
                'id': schedule[0],
                'name': schedule[2],
                'description': schedule[3],
                'day': schedule[4],
                'start': schedule[5].strftime(DATE_FORMAT),
                'end': schedule[6].strftime(DATE_FORMAT),
                'discount': schedule[7],
                'num_vouchers': schedule[8]
            }
        )
    return {"vouchers": vouchers, "schedules": schedules}

"""
    Given a voucher ID, checks that it is valid - if so, returns the 
    voucher with information regarding how many copies are left, its 
    expiry date and the ID of the eatery that distributed it. 
    Otherwise, raises an exception if voucher doesn't exist in the db,
    or is already expired.
"""
def verify_voucher(cur: cursor, voucher_id: str):
    verify_voucher = """
        SELECT num_vouchers, end_date, eatery_id
        FROM vouchers
        WHERE id = %s AND num_vouchers > 0
    """

    cur.execute(verify_voucher, [int(voucher_id)])
    voucher = cur.fetchone()

    if not voucher:
        # doesn't exist in db - invalid (e.g. deleted, none left)
        return None

    end_date = voucher[1]
    curr_date = datetime.now()

    # check date
    if curr_date >= end_date:
        # expired voucher
        return None

    return voucher

"""
    Creates a voucher code for a given primary voucher which is to be obtained
    by the given diner. This code is stored in a table in the database for 
    verification purposes (as well as for letting the diner view their obtained
    vouchers).
"""
def create_code(db: connection, cur: cursor, voucher_id: str, diner_id: str):
    create_voucher_code = """
        INSERT INTO voucher_codes (code, voucher_id, diner_id)
        VALUES (%s, %s, %s)
    """

    ch = ascii_letters + digits
    length = 6
    gen_code = ''.join(choices(ch, k=length)) + diner_id + voucher_id
    cur.execute(create_voucher_code, [gen_code, voucher_id, diner_id])
    db.commit()

"""
    -> checks that user has not already obtained this voucher
    -> check that there are still vouchers left (num_vouchers)
    -> generates unique code (stored in voucher_codes)
    -> reduce num_vouchers by 1 
"""
def obtain_voucher(db: connection, voucher_id: str, diner_id: str):
    check_unique = """
        SELECT *
        FROM voucher_codes
        WHERE voucher_id = %s AND diner_id = %s
    """

    update_voucher = """
        UPDATE vouchers
        SET num_vouchers = %s
        WHERE id = %s
    """

    delete_voucher = """
        DELETE
        FROM vouchers
        WHERE id = %s
        RETURNING num_vouchers
    """

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

    cur = db.cursor()

    # check diner has not obtained same voucher already
    cur.execute(check_unique, [int(voucher_id), int(diner_id)])
    result = cur.fetchone()
    if result:
        raise InputError(description='ERROR: already obtained this voucher previously')

    # check num_vouchers > 0 and not expired
    voucher = verify_voucher(cur, voucher_id)
    if not voucher:
        raise InputError(description='Invalid voucher')

    num_vouchers = voucher[0]
    cur.execute(update_voucher, [num_vouchers - 1, voucher_id])
    db.commit()

    eatery_id = voucher[2]
    cur.execute(get_tags_w_name, [eatery_id])
    result = cur.fetchone()

    if result:
        tags = result[0]
        eatery = result[1]
        if tags == None:
            tags = []
        cur.execute(add_tags, [tags, eatery, int(diner_id)])
        db.commit()

    create_code(db, cur, voucher_id, diner_id)
    cur.close()
    return {}

"""
    Checks that the given voucher code is valid by cross-checking that it
    is present in the voucher_codes table in the database. It also checks
    that the code is being redeemed within the valid time period stated by
    the voucher. If so, returns the details of the voucher associated with 
    the given code, including name, description and discount rate.
"""
def redeem_voucher(db: connection, code: str, eatery_id: str):
    check_code = """
        SELECT diner_id
        FROM voucher_codes c
        JOIN vouchers v
        ON (c.voucher_id = v.id)
        WHERE code = %s
        AND eatery_id = %s
    """

    delete_code = """
        DELETE
        FROM voucher_codes
        WHERE code = %s
    """

    get_info = """
        SELECT start_date, end_date, name, description, discount_rate
        FROM vouchers v
        JOIN voucher_codes c
        ON (v.id = c.voucher_id)
        WHERE c.code = %s
    """

    cur = db.cursor()
    cur.execute(check_code, [code, int(eatery_id)])
    result = cur.fetchone()
    if not result:
        cur.close()
        return redeem_loyalty_voucher(db, code, eatery_id)
    diner_id = result[0]
    cur.execute(get_info, [code])
    voucher_info = cur.fetchone()
    start = voucher_info[0]
    end = voucher_info[1]
    name = voucher_info[2]
    description = voucher_info[3]
    discount = voucher_info[4]

    curr = datetime.now()
    if start > curr or end < curr:
        cur.close()
        raise InputError(description='The code cannot be used outside of valid time period')
    increment_loyalty_points(db, diner_id, eatery_id)
    cur.execute(delete_code, [code])
    db.commit()
    cur.close()
    return {'name': name, 'description': description, 'discount': discount}

"""Checks voucher code for a loyalty voucher, similar implementation to redeem_voucher
    written above.
"""
def redeem_loyalty_voucher(db: connection, code: str, eatery_id: int) -> dict:
    cur = db.cursor()
    get_loyalty_voucher = """
        SELECT type, item
        FROM voucher_codes c
        JOIN loyalty_vouchers lv
        ON (c.loyalty_voucher_id = lv.id)
        WHERE code = %s
        AND eatery_id = %s
    """
    cur.execute(get_loyalty_voucher, [code, eatery_id])
    result = cur.fetchone()
    if not result:
        cur.close()
        raise InputError(description='The inputted code is invalid')

    loyalty_type, item = result
    delete_code = """
        DELETE
        FROM voucher_codes
        WHERE code = %s
    """
    cur.execute(delete_code, [code])
    db.commit()
    cur.close()
    return {'type': loyalty_type, 'item': item}

"""
    Creates a regular schedule for distributing vouchers. Raises an exception if the
    number of vouchers mentioned is less than 1.
"""
def schedule_voucher(db: connection, eatery_id: str, name: str, desc: str, discount: str, num_vouchers: str, day: str, start: str, end: str, isWeekly: bool):
    create_schedule = """
        INSERT INTO discountschedule (eatery_id, name, description, day, start_time, end_time, discount, num_vouchers)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING id
    """

    # user input checking
    try:
        if int(num_vouchers) < 1:
            raise InputError(description='Number of vouchers must be greater than 0')
    except ValueError:
        raise InputError(description='Missing number of vouchers')

    start_time = datetime.strptime(start, '%H:%M:%S')
    end_time = datetime.strptime(end, '%H:%M:%S')
    
    if not isWeekly and (end_time.time() <= datetime.now().time()):
        raise InputError(description='End time must be later than the time right now')

    cur = db.cursor()
    cur.execute(create_schedule, [int(eatery_id), name, desc, day, start_time, end_time, discount, int(num_vouchers)])
    schedule_id = cur.fetchone()[0]
    db.commit()
    cur.close()
    return str(schedule_id)

"""
    Given the ID for a schedule, removes that schedule from the database.
"""
def delete_schedule(db: connection, schedule_id: str):
    del_sched = """
        DELETE FROM
        discountschedule
        where id = %s
    """

    cur = db.cursor()
    cur.execute(del_sched, [int(schedule_id)])
    db.commit()
    cur.close()
    return {}
