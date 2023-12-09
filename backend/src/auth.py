"""Contains the functions related to registering, logging in, and logging out
of accounts.
"""

import hashlib
import re
import smtplib
import time
import uuid
from email.message import EmailMessage
from email.utils import formataddr

from psycopg2.extensions import connection

import jwt

from src.error import AccessError
from src.error import InputError


def check_valid_token(db: connection, token: str) -> dict:
    """Checks if the provided token is valid and returns the user_id,
       session_id, and whether the user is a diner

    Arguments:
        db      (psycopg2.connection) - A connection to a database
        token   (str) - A generated JWT that validates the user.

    Exceptions:
        AccessError - Is called when the following occurs:
            -   The encoded JWT does not have the correct signature.
            -   The session_id in the payload of the JWT is logged out.
            -   The user_id in the payload of the JWT is not valid.

    Return Value:
        Returns a dict containing the user_id (int), session_id (dict),
        and is_diner (bool) if the token is valid.
    """

    try:
        payload = jwt.decode(token, 'SECRET', algorithms=['HS256'])
    except jwt.exceptions.InvalidTokenError:
        raise AccessError(description='Invalid token') from None

    is_diner = None
    query = """
    select * from diner_sessions
    where diner = %s and session_uuid = %s and time_created = %s;
    """
    cur = db.cursor()
    query_params = [payload['user_id'], payload['session_id']
                    ['uuid'], payload['session_id']['time_created']]
    cur.execute(query, query_params)

    if cur.fetchall():
        is_diner = True
    else:
        query = """
        select * from eatery_sessions
        where eatery = %s and session_uuid = %s and time_created = %s;
        """
        cur.execute(query, query_params)
        if cur.fetchall():
            is_diner = False

    cur.close()

    if is_diner is None:
        raise AccessError(description='Invalid token')
    return {'user_id': payload['user_id'], 'session_id': payload['session_id'],
            'is_diner': is_diner}


def create_token(db: connection, user_id: int, is_diner: bool) -> dict:
    """Given a valid user_id, returns a new encoded JWT token.

    Arguments:
        db         (psycopg2.connection) - A connection to a database.
        user_id    (int)    - The user's id from input.
        is_diner   (bool)   - Whether the user is a diner.

    Return Value:
        Returns a dict containing a token (str) if the user_id is valid.
    """

    session_id = {'uuid': str(uuid.uuid4()), 'time_created': float(
        "{:.7f}".format(time.time()))}
    payload = {
        'user_id': user_id,
        'session_id': session_id,
    }

    table = "diner" if is_diner else "eatery"
    query = f"""insert into {table + "_sessions"} ({table}, session_uuid, time_created)
                values ({user_id}, '{session_id['uuid']}', {session_id['time_created']})"""
    cur = db.cursor()
    cur.execute(query, [])
    db.commit()
    cur.close()
    new_token = jwt.encode(payload=payload, key='SECRET', algorithm='HS256')
    return {'token': new_token}


def auth_register_diner(db: connection, email: str, username: str, password: str) -> dict:
    """Registers a new diner.

    Given that the provided information is valid, creates a
    new account and generates a user_id and token.
    Returns the user_id and token.

    Arguments:
        db          (psycopg2.connection) - A connection to a database.
        email       (string)  - The user's email given by input.
        username    (string)  - The user's username given by input.
        password    (string)  - The user's password given by input.

    Exceptions:
        InputError - Is raised when the following occurs:
            -   If the provided information is not valid.

    Return Value:
        Returns a dict containing both user_id (int) and token (str).
    """

    check_valid_email(db, email)
    if len(password) < 6:
        raise InputError(
            description="New password must be at least 6 characters")

    password = hashlib.sha256(password.encode()).hexdigest()
    query = "insert into diners (email, username, password) values (%s, %s, %s) returning id;"
    cur = db.cursor()
    cur.execute(query, [email, username, password])
    diner_id = cur.fetchone()[0]
    db.commit()
    cur.close()
    new_token = create_token(db, diner_id, True).get('token')
    return {'token': new_token, 'user_id': diner_id}


def auth_register_eatery(db: connection, email: str, password: str, name: str,
                         contact: str, address: str, latitude: str, longitude: str) -> dict:
    """Registers a new eatery.

    Given that the provided information is valid, creates a
    new account and generates a user_id and token.
    Returns user_id and token.

    Arguments:
        db              (psycopg2.connection) - A connection to a database.
        email           (string)  - The user's email given by input.
        eatery_name     (string)  - The eatery's name, given by input.
        password        (string)  - The user's password given by input.
        phone_number    (string)  - The eatery's phone number, given by input.
        address         (string)  - The eatery's address, given by input.
        latitude        (string)  - The latitude of the eatery, given by input.
        longitude       (string)  - The longitude of the eatery, given by input.

    Exceptions:
        InputError - Is raised when the following occurs:
            -   If the provided information is not valid.

    Return Value:
        Returns a dict containing both user_id (int) and token (str).
    """
    if latitude:
        latitude = round(float(latitude), 6)
    if longitude:
        longitude = round(float(longitude), 6)
    check_valid_email(db, email)
    if len(password) < 6:
        raise InputError(
            description="New password must be at least 6 characters")

    if len(contact) > 10:
        raise InputError(description="Phone number is too long")

    password = hashlib.sha256(password.encode()).hexdigest()
    query = """
    insert into eateries (email, password, eatery_name, address, phone_number, latitude, longitude)
    values (%s, %s, %s, %s, %s, %s, %s) returning id;
    """
    cur = db.cursor()
    cur.execute(query, [email, password, name, address, contact, latitude, longitude])
    eatery_id = cur.fetchone()[0]
    query = """
    insert into loyalty_system (eatery_id) values (%s);
    """
    cur.execute(query, [eatery_id])
    db.commit()
    cur.close()
    new_token = create_token(db, eatery_id, False).get('token')
    return {'token': new_token, 'user_id': eatery_id}


def check_valid_email(db: connection, email: str) -> None:
    """Checks whether the given email matches the formatting of an email address.

    Arguments:
        db          (psycopg2.connection) - A connection to a database.
        email       (string)  - The user's email given by input.

    Exceptions:
        InputError - Is raised when the following occurs:
            -   The email is not formatted properly
            -   The email is already associated with an account
    """
    regular_expression = r'^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'
    if re.fullmatch(regular_expression, email) is None:
        raise InputError(description='The provided email is not valid')

    query = """
    select d.email from diners d
    where d.email = %s
    union
    select e.email from eateries e
    where e.email = %s;
    """
    cur = db.cursor()
    cur.execute(query, [email, email])
    if cur.fetchall():
        cur.close()
        raise InputError(description='This email address is already '
                         'associated with an existing account')
    cur.close()


def auth_login(db: connection, email: str, password: str) -> dict:
    """Given a valid email and password, returns a new token.

    Arguments:
        db              (psycopg2.connection) - A connection to a database.
        email           (string) - The user's email given by user input.
        password        (string) - The user's password given by user input.

    Exceptions:
        InputError - Is raised when the following occurs:
            -   The email provided is not linked to
                an account, or when the password provided is incorrect.

    Return Value:
        Returns a dict containing both user_id (int) and token (str)
        if both the email and password are valid.
    """
    query = """
    select d.id from diners d
    where d.email = %s and d.password = %s
    union
    select e.id from eateries e
    where e.email = %s and e.password = %s;
    """
    cur = db.cursor()
    cur.execute(query, [email, hashlib.sha256(
        password.encode()).hexdigest()] * 2)
    results = cur.fetchall()
    cur.close()
    if not results:
        raise InputError(description='Email or password is incorrect')
    user_id = results[0][0]
    is_diner = get_user_status(db, user_id)
    return {'token': create_token(db, user_id, is_diner).get('token'),
                'user_id': user_id, 'is_diner': is_diner}


def get_user_status(db: connection, user_id: int) -> bool:
    """Returns whether the user is a diner or eatery. Assumes the user_id corresponds to a user.

    Arguments:
        user_id     (int) - The id of the user.

    Return Value:
        Returns is_diner (bool), that is true if the user is a diner and false if
        the user is an eatery.
    """

    query = """
    select * from diners d
    where d.id = %s
    """
    cur = db.cursor()
    cur.execute(query, [user_id])
    results = cur.fetchall()
    cur.close()
    if results:
        return True
    return False


def auth_logout(db: connection, token: str) -> dict:
    """When given a valid token, remove it from the table of session_ids.

    Arguments:
        token       (str)  - A generated JWT that validates the user.

    Exceptions:
        AccessError - Is raised when the following occurs:
            -   If the JWT token is invalid.
            -   If the decoded user_id is invalid.
            -   If the decoded session_id has already been logged out.

    Return Value:
        Returns an empty dict.
    """
    payload = check_valid_token(db, token)
    table = "diner" if payload['is_diner'] else "eatery"

    query = f"""
    delete from {table + "_sessions"}
    where {table}=%s and session_uuid=%s
    returning *;
    """
    cur = db.cursor()
    cur.execute(query, [payload['user_id'], payload['session_id']['uuid']])
    if not cur.fetchall():
        raise AccessError(description='Invalid token')
    db.commit()
    cur.close()
    return {}


def auth_user_reset_email(db: connection, email: str) -> dict:
    """When given an email address of a user, sends it a reset code.

    If the email given is not associated with a user in the database,
    return without raising an error.

    Arguments:
        db      (psycopg2.connection) - A connection to a database.
        email   (str)  - The user's email address.

    Return Value:
        Returns an empty dict.
    """
    is_diner = None
    user_id = None
    username = None

    query = """
    select d.id, d.username from diners d
    where d.email = %s;
    """
    cur = db.cursor()
    cur.execute(query, [email])
    results = cur.fetchall()
    if results:
        is_diner = True
        user_id = results[0][0]
        username = results[0][1]

    query = """
    select e.id, e.eatery_name from eateries e
    where e.email = %s;
    """
    if not is_diner:
        cur.execute(query, [email])
        results = cur.fetchall()
        if results:
            is_diner = False
            user_id = results[0][0]
            username = results[0][1]

    if is_diner is None:
        return {}

    # Log the user out of all active sessions.
    table = "diner" if is_diner else "eatery"
    query = f"""
    delete from {table + "_sessions"}
    where {table}=%s
    """
    cur.execute(query, [user_id])
    db.commit()

    # Create a unique 36 character long random reset_code.
    reset_code = str(uuid.uuid4())
    table = "diners" if is_diner else "eateries"
    query = f"""
    select * from {table}
    where reset_code = %s;
    """
    cur.execute(query, [reset_code])
    while cur.fetchall():
        reset_code = str(uuid.uuid4())
        cur.execute(query, [reset_code])

    # Add the reset_code to the database
    query = f"""
    update {table}
    set reset_code = %s
    where id = %s;
    """
    cur.execute(query, [reset_code, user_id])
    db.commit()
    cur.close()
    send_email(email, username, reset_code)
    return {}


def send_email(email: str, username: str, reset_code: str) -> None:
    """
    Sends an email for the password reset request.

    Arguments:
        email       (str) - The email recipient.
        reset_code  (str) - The code to be sent.
    """
    sender = "fiveguys3900@gmail.com"
    msg = EmailMessage()
    msg['From'] = formataddr(("Five Guys", sender))
    msg['To'] = formataddr((username, email))
    msg['Subject'] = "Password Reset for your Five Guys Account"
    msg.set_content(f"""
A user has requested a password reset for a Five Guys account associated with
this email address. If you did not send this request, ignore this message.\n
The code verifier given is {reset_code}
Use this code to reset your password.""")
    s = smtplib.SMTP("smtp.gmail.com", 587)
    s.starttls()
    s.login(sender, "sfjsfehltuhgrooo")
    s.send_message(msg)
    s.quit()


def auth_user_reset(db: connection, reset_code: str, new_password: str) -> dict:
    """When given a valid reset code and valid new password, changes the password
    of the associated user.

    Arguments:
        db      (psycopg2.connection) - A connection to a database.
        reset_code      (str)  - The reset code for the account.
        new_password    (str)  - The new password for the account.

    Exceptions:
        InputError - Is raised when the following occurs:
            -   If the reset_code is invalid.
            -   If the new_password is less than 6 characters.

    Return Value:
        Returns an empty dict.
    """
    if len(new_password) < 6:
        raise InputError(
            description="New password must be at least 6 characters")

    query = """
    select d.id from diners d
    where d.reset_code = %s
    union
    select e.id from eateries e
    where e.reset_code = %s;
    """
    cur = db.cursor()
    cur.execute(query, [reset_code, reset_code])
    results = cur.fetchall()
    if not results:
        cur.close()
        raise InputError(description='Invalid reset code entered')
    user_id = results[0][0]
    password = hashlib.sha256(new_password.encode()).hexdigest()
    query = """
    update diners
    set password = %s, reset_code = NULL
    where id = %s;
    update eateries
    set password = %s, reset_code = NULL
    where id = %s;
    """
    cur.execute(query, [password, user_id] * 2)
    db.commit()
    cur.close()
    return {}


def auth_user_update_password(db: connection, user_id: int,
                              current_password: str, new_password: str) -> dict:
    if len(new_password) < 6:
        raise InputError(
            description="New password must be at least 6 characters")

    current_password = hashlib.sha256(current_password.encode()).hexdigest()
    new_password = hashlib.sha256(new_password.encode()).hexdigest()

    query = """
    select id from diners
    where id = %s and password = %s
    union
    select id from eateries
    where id = %s and password = %s;
    """
    cur = db.cursor()
    cur.execute(query, [user_id, current_password] * 2)
    if not cur.fetchall():
        cur.close()
        raise InputError(description="Current password is incorrect")

    query = """
    update diners
    set password = %s
    where id = %s;
    update eateries
    set password = %s
    where id = %s;
    """
    cur.execute(query, [new_password, user_id] * 2)
    db.commit()
    cur.close()
    return {}
