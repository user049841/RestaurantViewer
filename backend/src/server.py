from json import dumps
import signal
from flask import Flask, request
from flask_cors import CORS
import psycopg2
from src import config
from datetime import datetime

from apscheduler.schedulers.background import BackgroundScheduler

from src.auth import auth_register_eatery
from src.auth import auth_register_diner
from src.auth import auth_login
from src.auth import auth_logout
from src.auth import auth_user_reset_email
from src.auth import auth_user_reset
from src.auth import auth_user_update_password
from src.auth import check_valid_token

from src.loyalty import edit_loyalty_system
from src.loyalty import obtain_loyalty_voucher
from src.loyalty import view_loyalty_vouchers

from src.profile import diner_update_details
from src.profile import diner_get_details
from src.profile import diner_blacklist_eatery
from src.profile import eatery_update_details
from src.profile import eatery_update_menu
from src.profile import eatery_get_details
from src.profile import eatery_get_all_eateries
from src.profile import eatery_get_menu
from src.profile import eatery_get_all_tags

from src.review import create_review
from src.review import create_reply
from src.review import delete_review
from src.review import edit_review
from src.review import get_reviews

from src.voucher import create_vouchers
from src.voucher import get_vouchers_and_schedules
from src.voucher import redeem_voucher
from src.voucher import obtain_voucher
from src.voucher import schedule_voucher
from src.voucher import delete_schedule
from src.voucher import diner_view_vouchers

def defaultHandler(err):
    db.rollback()
    try:
        response = err.get_response()
        print('response', err, err.get_response())
        response.data = dumps({
            'code': err.code,
            'name': 'System Error',
            'message': err.description
        })
        response.content_type = 'application/json'
        return response
    except:
        raise Exception(str(err)) from err


APP = Flask(__name__, static_url_path='')
CORS(APP)

APP.config['TRAP_HTTP_EXCEPTIONS'] = True
APP.register_error_handler(Exception, defaultHandler)

job_defaults = {
    'coalesce': True,
    'max_instances': 1
}

def close_db(*args):
    if db is not None:
        db.close()
    exit(0)


@APP.route('/auth/register/eatery', methods=['POST'])
def server_register_eatery() -> str:
    """When given valid credentials for an eatery, registers the eatery in the system.

    Arguments:
        email       (str)   - The email of the eatery account.
        password    (str)   - The password of the eatery account.
        name        (str)   - The name of the eatery.
        contact     (str)   - The phone number of the eatery.
        address     (str)   - The address of the eatery,.
    Exceptions:
        InputError - Is raised when the following occurs
            - The email provided is invalid.
            - The password provided is less than 6 characters.

    Return Value:
        Returns a JSON string representing a dict containing both user_id
        (int) and token (str).
    """
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    name = data.get('name')
    contact = data.get('contact').replace(' ', '')
    address = data.get('address')
    latitude = data.get('latitude')
    longitude = data.get('longitude')
    return dumps(auth_register_eatery(db, email, password, name, contact, address, latitude, longitude))


@APP.route('/auth/register/diner', methods=['POST'])
def server_register_diner() -> str:
    """When given valid credentials for a diner, registers the diner in the system.

    Arguments:
        email       (str)   - The email of the diner account.
        username    (str)   - The username of the diner account.
        password    (str)   - The password of the diner account.

    Exceptions:
        InputError - Is raised when the following occurs
            - The email provided is invalid
            - The password provided is less than 6 characters

    Return Value:
        Returns a JSON string representing a dict containing both user_id
        (int) and token (str).
    """
    data = request.get_json()
    email = data.get('email')
    username = data.get('name')
    password = data.get('password')
    return dumps(auth_register_diner(db, email, username, password))


@APP.route('/auth/login', methods=['POST'])
def server_login() -> str:
    """When given a valid email and password, returns the matching token value

    Arguments:
        email       (str)   - The email of the user account.
        password    (str)   - The password of the user account.

    Exceptions:
        InputError - Is raised when the following occurs
            - The email provided is not linked to an account, or
              the password provided is incorrect.

    Return Value:
        Returns a JSON string representing a dict containing both user_id (int) and token (str)
        if both the email and password are valid.
    """
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    return dumps(auth_login(db, email, password))


@APP.route('/auth/logout', methods=['POST'])
def server_logout() -> str:
    """When given a valid token, removes it from the table of session ids.

    Arguments:
        token   (str)  - A generated JWT that validates the user.

    Exceptions:
        AccessError - Is raised when the following occurs:
            -   If the decoded user_id is invalid.
            -   If the decoded session_id has already been logged out.

    Return Value:
        Returns a JSON string representing an empty dictionary.
    """
    data = request.get_json()
    token = data.get('token')
    return dumps(auth_logout(db, token))


@APP.route('/auth/reset/email', methods=['POST'])
def server_user_reset_email() -> str:
    """When given an email address of a user, sends it a UUID to use as a reset code.

    If the email given does not correspond with a user in the database,
    returns without raising an error.

    Arguments:
        email   (str)  - The user's email address.

    Return Value:
        Returns a JSON string representing an empty dictionary.
    """

    data = request.get_json()
    email = data.get('email')
    return dumps(auth_user_reset_email(db, email))


@APP.route('/auth/reset/code', methods=['POST'])
def server_user_reset() -> str:
    """When given a valid reset code and valid new password, changes the password
    of the associated user.

    Arguments:
        reset_code      (str)  - The reset code for the account.
        new_password    (str)  - The new password for the account.

    Exceptions:
        InputError - Is raised when the following occurs:
            -   If the reset_code is invalid.
            -   If the new_password is less than 6 characters.

    Return Value:
        Returns a JSON string representing an empty dictionary.
    """

    data = request.get_json()
    reset_code = data.get('code')
    new_password = data.get('password')
    return dumps(auth_user_reset(db, reset_code, new_password))


@APP.route('/auth/update/password', methods=['POST'])
def server_user_update_password() -> str:
    """Given a valid token and current password, updates the corresponding user's
    password to the new password.

    Arguments:
        token               (str) - A generated JWT that validates the user.
        current_password    (str) - The current password of the user.
        new_password        (str) - The new password the user's password will be updated to.

    Exceptions:
        InputError - Is raised when the following occurs:
            - The current_password is incorrect.
            - The new_password is invalid.
        AccessError - Is raised when the following occurs:
            - The token is invalid.

    Return Value:
        Returns a JSON string representing an empty dictionary.
    """
    data = request.get_json()
    user_id = check_valid_token(db, data.get('token'))['user_id']
    current_password = data.get('current_password')
    new_password = data.get('new_password')
    return dumps(auth_user_update_password(db, user_id, current_password, new_password))


@APP.route('/review/create', methods=['POST'])
def server_create_review() -> str:
    """Given a valid token and review, updates the eatery to add the review.

    Arguments:
        token       (str)   - A generated JWT that validates the user.
        rating      (float) - A rating from 0.5 to 5.0 in increments of 0.5.
        title       (str)   - The title of the review.
        description (str)   - The review contents.
        eatery_id   (int)   - The id of the eatery being reviewed.
        timestamp   (str)   - A timestamp of when the review was made.

    Exceptions:
        AccessError - Is raised when the following occurs
            - The token is invalid.
        InputError - Is raised when the following occurs
            - The eatery_id is invalid.
            - The rating is invalid.

    Return Value:
        Returns a JSON string representing an empty dictionary.
    """
    data = request.get_json()
    user_id = check_valid_token(db, data.get('token'))['user_id']
    rating = data.get('rating')
    title = data.get('title')
    description = data.get('description')
    eatery_id = data.get('eatery_id')
    timestamp = data.get('date')
    return dumps(create_review(db, user_id, rating, title, description, eatery_id, timestamp))


@APP.route('/review/edit', methods=['PUT'])
def server_edit_review() -> str:
    """When given a valid review_id, token, and review, edits the review
    to become the new review.

    Arguments:
        review_id   (int)   - The id of the review.
        token       (str)   - A generated JWT that validates the user.
        rating      (float) - The rating the user is giving.
        title       (str)   - The title of the review.
        description (str)   - The review contents.

    Exceptions:
        AccessError - Is raised when the following occurs:
            - The token is not valid.
            - The token does not match to the user that made the review.
        InputError - Is raised when the following occurs:
            - The review_id is not valid.

    Return Value:
        Returns a JSON string representing an empty dictionary.
    """
    data = request.get_json()
    review_id = data.get('id')
    user_id = check_valid_token(db, data.get('token'))['user_id']
    rating = data.get('rating')
    title = data.get('title')
    description = data.get('description')
    return dumps(edit_review(db, review_id, user_id, rating, title, description))


@APP.route('/review/delete', methods=['POST'])
def server_delete_review() -> str:
    """When given a valid token and review_id, deletes the
    corresponding review.
    Arguments:
        token       (str) - A generated JWT that validates the user.
        review_id   (int) - The id of the review to delete.
    Exceptions:
        AccessError - Is raised when the following occurs:
            - The token is invalid.
            - The token does not match to the user that made the review.
        InputError - Is raised when the following occurs:
            - The review_id is invalid.
    Return Value:
        Returns a JSON string representing an empty dictionary.
    """
    data = request.get_json()
    review_id = data.get('review_id')
    user_id = check_valid_token(db, data.get('token'))['user_id']
    return dumps(delete_review(db, review_id, user_id))


@APP.route('/review/reply/create', methods=['POST'])
def server_create_reply() -> str:
    """Given a valid token and review, updates the eatery to add the review.

    Arguments:
        token       (str)   - A generated JWT that validates the user.
        description (str)   - The review contents.
        review_id   (int)   - The id of the review being replied to.
        eatery_id   (int)   - The id of the eatery being reviewed.
        timestamp   (str)   - A timestamp of when the review was made.

    Exceptions:
        AccessError - Is raised when the following occurs
            - The token is invalid.
        InputError - Is raised when the following occurs
            - The eatery_id is invalid.
            - The review_id is invalid.
            - Making the reply would result in 5 nested replies.

    Return Value:
        Returns a JSON string representing an empty dictionary.
    """
    data = request.get_json()
    user_id = check_valid_token(db, data.get('token'))['user_id']
    description = data.get('description')
    review_id = data.get('review_id')
    eatery_id = data.get('eatery_id')
    timestamp = data.get('date')
    return dumps(create_reply(db, user_id, description, review_id, eatery_id, timestamp))


@APP.route('/browse/eatery/<eatery_id>/reviews', methods=['GET'])
def server_get_reviews(eatery_id: str) -> str:
    """
    When given a valid eatery_id, fetches the reviews for the
    corresponding eatery.

    Arguments:
        eatery_id   (str)   - The id of the eatery to fetch reviews for.

    Exceptions:
        InputError - Is raised when the following occurs:
            - The eatery_id is invalid.

    Returns:
        Returns a JSON string representing the reviews.
    """
    return get_reviews(db, int(eatery_id))


@APP.route('/browse/eatery/menu/<eatery_id>', methods=['GET'])
def server_eatery_get_menu(eatery_id: str) -> str:
    """When given a valid eatery_id, returns the menu of the eatery.

    Arguments:
        eatery_id   (str) - The id of the eatery to get the menu of.

    Exceptions:
        InputError - Is raised when the following occurs:
            - The eatery_id is invalid.

    Return Value:
        Returns a JSON string representing the eatery menu.
    """
    return dumps(eatery_get_menu(db, eatery_id))


@APP.route('/user/profile/eatery/edit/menu/<eatery_id>', methods=['PUT'])
def server_eatery_edit_menu(eatery_id: str) -> str:
    """When given a valid eatery id, token, and updates the menu of the eatery
    to the given menu.

    Arguments:
        eatery_id   (str)  - The id of the eatery to update the menu of.
        token       (str)  - A generated JWT that validates the user.
        menu        (list) - The new menu for the eatery.

    Exceptions:
        AccessError - Is raised when the following occurs:
            - The token of the user is invalid.
        InputError - Is raised when the following occurs:
            - The eatery_id is invalid.

    Return Value:
        Returns a JSON string representing an empty dict.
    """
    data = request.get_json()
    token_dict = check_valid_token(db, data.get('token'))
    menu = data.get('menu')
    return dumps(eatery_update_menu(db, token_dict, eatery_id, menu))


@APP.route('/eateries/tags', methods=['GET'])
def server_get_all_tags() -> str:
    """Gets the union of all tags for all eateries.

    Return Value:
        Returns a dictionary containing a
        list of all tags.
    """
    return dumps(eatery_get_all_tags(db))


# eatery users


@APP.route('/user/profile/eatery/edit/<eatery_id>', methods=['PUT'])
def server_eatery_edit_details(eatery_id) -> str:
    """When given valid parameters, updates relevant fields in the database for the
       select eatery user. 

    Arguments:
        email       (str)   - The email of the user account.
        name        (str)   - The name of the user account
        description (str)   - Block of text describing the eatery.
        contact     (str)   - Eatery's phone number
        address     (str)   - Address of the user's eatery
        avatar      (str)   - Eatery's profile picture
        image       (str)   - Eatery's display images on their profile page
        pricing     (str)   - Eatery's average price range offered
        tags        ([str]) - Labels associated with eatery e.g. Chinese food
        latitude    (str)   - The latitude of the user's eatery
        longitude   (str)   - The longitude of the user's eatery

    Exceptions:
        InputError - Is raised when the following occurs:
            - The contact number given exceeds 10 characters in length

    Return Value:
        Returns an empty dictionary on success
    """
    data = request.get_json()
    email = data.get('email')
    name = data.get('name')
    desc = data.get('description')
    contact = data.get('contact')
    address = data.get('address')
    avatar = data.get('avatar')
    images = data.get('images')
    pricing = data.get('pricing')
    tags = data.get('tags')
    latitude = data.get('latitude')
    longitude = data.get('longitude')
    return dumps(eatery_update_details(db, eatery_id, email, name, desc, contact, address,
                                       avatar, images, pricing, tags, latitude, longitude))


@APP.route('/browse/eatery', methods=['POST'])
def server_eatery_get_details() -> str:
    """Retrieves all details for a select eatery user.

    Arguments:
        eatery_id   (str)   - ID of the select eatery
        latitude    (str)   - The latitude of the current user
        longitude   (str)   - The longitude of the current user

    Return Value:
        Returns a JSON dictionary containing the eatery's details
        on success
    """
    data = request.get_json()
    eatery_id = data.get('id')
    latitude = data.get('latitude')
    longitude = data.get('longitude')
    return dumps(eatery_get_details(db, eatery_id, latitude, longitude))


@APP.route('/browse/eateries', methods=['POST'])
def server_eatery_get_all_eateries() -> str:
    """Retrieves all details for all registered eatery users.

    Arguments:
        latitude    (str)   - The latitude of the current user
        longitude   (str)   - The longitude of the current user

    Return Value:
        Returns a list of JSON dictionaries containing all eateries' details
        on success
    """
    data = request.get_json()
    latitude = data.get('latitude')
    longitude = data.get('longitude')
    return dumps(eatery_get_all_eateries(db, latitude, longitude))


# diner users


@APP.route('/user/profile/diner/edit/<diner_id>', methods=['PUT'])
def diner_edit_details(diner_id) -> str:
    """When given valid parameters, updates relevant fields in the database for the
       select user. 

    Arguments:
        email       (str)   - The email of the user account.
        name        (str)   - The name of the user account
        contact     (str)   - Diner's phone number
        avatar      (str)   - Diner's profile picture

    Exceptions:
        InputError - Is raised when the following occurs:
            - The contact number given exceeds 10 characters in length

    Return Value:
        Returns a JSON string representing an empty dict on success
    """
    data = request.get_json()
    email = data.get('email')
    name = data.get('name')
    avatar = data.get('avatar')
    return dumps(diner_update_details(db, diner_id, email, name, avatar))

@APP.route('/user/profile/diner/<diner_id>', methods=['GET'])
def server_diner_get_details(diner_id) -> str:
    """When given valid diner id, retrieves all details for the select diner user.

    Arguments:
        diner_id    (str)   - The id of the diner user

    Return Value:
        Returns a dictionary that encapsulates diner details.
    """
    return dumps(diner_get_details(db, diner_id))

@APP.route('/blacklist/eatery', methods=['POST'])
def server_diner_blacklist_eatery() -> str:
    """When given a valid eatery id, adds this eatery id to the diner's
        blacklist of eateries (block eatery from popping up in recommendations)

    Arguments:
        token       (str)   - A generated JWT that validates the user.
        eatery_id   (str)   - Id of the eatery that the user wants to blacklist

    Return Value:
        Returns an empty dictionary
    """
    data = request.get_json()
    diner_id = check_valid_token(db, data.get('token'))['user_id']
    eatery_id = data.get('id')
    return dumps(diner_blacklist_eatery(db, diner_id, eatery_id))


# loyalty system
@APP.route('/eatery/loyalty/edit', methods=['POST'])
def server_edit_loyalty_system() -> str:
    """When passed valid arguments, updates the loyalty system
    for an eatery to the given details.

    Arguments:
        token        (str)   - A generated JWT that validates the user.
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
        Returns a JSON string representing an empty dict.
    """
    data = request.get_json()
    eatery_id = check_valid_token(db, data.get('token'))['user_id']
    enabled = data.get('enabled')
    loyalty_type = data.get('type')
    item = data.get('item')
    point_goal = data.get('pointGoal')
    description = data.get('description')
    return dumps(edit_loyalty_system(db, eatery_id, enabled, loyalty_type, item, point_goal, description))


@APP.route('/diner/loyalty/obtain', methods=['POST'])
def server_obtain_loyalty_reward() -> str:
    """Given a diner and eatery, creates a corresponding voucher code.
    Resets the diner's loyalty points for that eatery to 0.

    Arguments:
        token       (str)   - The token of the diner redeeming the loyalty reward.
        eatery_id   (int)   - The id of the eatery whose reward is being redeemed.

    Exceptions:
        AccessError - Is raised when the following occurs:
            - The token of the user is invalid.
        InputError - Is raised when the following occurs:
            - The eatery_id does not refer to a valid eatery.

    Return Value:
        Returns a JSON string representing the voucher code.
    """
    data = request.get_json()
    diner_id = check_valid_token(db, data.get('token'))['user_id']
    eatery_id = int(data.get('eatery_id'))
    return dumps(obtain_loyalty_voucher(db, diner_id, eatery_id))


@APP.route('/diner/loyalty/voucher/view', methods=['POST'])
def server_view_loyalty_vouchers() -> str:
    """Given a diner, view the diner's loyalty vouchers.

    Arguments:
        token       (str)   - A generated JWT that validates the user.

    Exceptions:
        AccessError - Is raised when the following occurs:
            - The token of the user is invalid.
        InputError - Is raised when the following occurs:
            - The token does not refer to a diner.

    Return Value:
        Returns a JSON string representing the diner's vouchers.
    """
    data = request.get_json()
    diner_id = check_valid_token(db, data.get('token'))['user_id']
    return dumps(view_loyalty_vouchers(db, diner_id))


# vouchers


@APP.route('/voucher/create', methods=['POST'])
def server_eatery_create_voucher() -> str:
    """Creates a specified number of one-time vouchers for an eatery

    Arguments:
        token       (str)   - A generated JWT that validates the user.
        voucher_name (str)   - The name of the voucher to be created
        description  (str)   - Block of text describing voucher to be created 
        discount     (str)   - Discount rate of voucher to be created 
        num_vouchers (str)   - Number of copies of the voucher that can be obtained
        start        (str)   - Timestamp of when the voucher can be redeemed
        end          (end)   - Timestamp of when the voucher expires

    Exceptions:
        AccessError - Is raised when the following occurs:
            - The token of the user is invalid.

    Return Value:
        Returns a empty dictionary on success.
    """
    data = request.get_json()
    eatery_id = check_valid_token(db, data.get('token'))['user_id']
    voucher_name = data.get('name')
    description = data.get('description')
    discount = data.get('discount')
    num_vouchers = data.get('number')
    start = data.get('start')
    end = data.get('end')
    return dumps(create_vouchers(db, eatery_id, voucher_name, description, discount, num_vouchers, start, end))


@APP.route('/voucher/obtain', methods=['POST'])
def server_obtain_voucher() -> str:
    """ Given a valid diner and voucher, let the diner obtain the 
        voucher.
    
    Exceptions:
        AccessError - Is raised when the following occurs:
            - The token of the user is invalid.
        InputError - Is raised when the following occurs:
            - Voucher has already been obtained by this diner previously
            - Voucher has 0 copies left
            - Voucher is already expired
        
    Return Value:
        Returns a empty dictionary on success.
    """
    data = request.get_json()
    diner_id = str(check_valid_token(db, data.get('token'))['user_id'])
    voucher_id = str(data.get('voucher_id'))
    return dumps(obtain_voucher(db, voucher_id, diner_id))


@APP.route('/voucher/redeem', methods=['POST'])
def server_redeem_voucher() -> str:
    """Creates a specified number of one-time vouchers for an eatery

    Arguments:
        token       (str)   - A generated JWT that validates the user.
        code        (str)   - Input string to be checked if it is a valid code

    Exceptions:
        AccessError - Is raised when the following occurs:
            - The token of the user is invalid.

    Return Value:
        Returns a dictionary containing voucher's name, description & discount on success.
    """
    data = request.get_json()
    eatery_id = check_valid_token(db, data.get('token'))['user_id']
    code = data.get('code')
    return dumps(redeem_voucher(db, code, eatery_id))


@APP.route('/voucher/schedule/create', methods=['POST'])
def server_schedule_voucher() -> str:
    """Given a select voucher, creates a specified schedule for its
        distribution (e.g. weekly)

    Exceptions:
        AccessError - Is raised when the following occurs:
            - The token of the user is invalid.

        InputError - Is raised when the following occurs:
            - The number of vouchers is less than 1

    Return Value:
        Returns a empty dictionary on success.
    """
    data = request.get_json()
    eatery_id = check_valid_token(db, data.get('token'))['user_id']
    name = data.get('name')
    desc = data.get('description')
    discount = data.get('discount')
    num_vouchers = data.get('number')
    day = data.get('weekday')
    start = data.get('start')
    end = data.get('end')

    day_dict = {
        'Monday': 0,
        'Tuesday': 1,
        'Wednesday': 2,
        'Thursday': 3,
        'Friday': 4,
        'Saturday': 5,
        'Sunday': 6
    }

    schedule_id = schedule_voucher(db, eatery_id, name, desc, discount, num_vouchers, day, start, end, True)
    scheduler.add_job(create_vouchers, args=[db, eatery_id, name, desc, discount, num_vouchers, start, end],
                      trigger='cron', day_of_week=day_dict.get(day), id=schedule_id)
    scheduler.print_jobs()
    return dumps({})

@APP.route('/voucher/schedule/create/demo', methods=['POST'])
def server_schedule_voucher_demo() -> str:
    """Given a select voucher, creates a voucher every minute
       (for demonstration purposes)

    Exceptions:
        AccessError - Is raised when the following occurs:
            - The token of the user is invalid.

        InputError - Is raised when the following occurs:
            - The number of vouchers is less than 1

    Return Value:
        Returns a empty dictionary on success.
    """
    data = request.get_json()
    eatery_id = check_valid_token(db, data.get('token'))['user_id']
    name = data.get('name')
    desc = data.get('description')
    discount = data.get('discount')
    num_vouchers = data.get('number')
    interval = int(data.get('interval'))
    start = data.get('start')
    end = data.get('end')
    day = datetime.now().strftime('%A')

    schedule_id = schedule_voucher(db, eatery_id, name, desc, discount, num_vouchers, day, start, end, False)
    scheduler.add_job(create_vouchers, args=[db, eatery_id, name, desc, discount, num_vouchers, start, end],
                      trigger='interval', minutes=interval, id=schedule_id)
    scheduler.print_jobs()
    return dumps({})

@APP.route('/voucher/schedule/stop', methods=['POST'])
def server_stop_schedule_voucher() -> str:
    """Given a select schedule, stops it"""

    data = request.get_json()
    schedule_id = data.get('schedule_id')
    try:
        scheduler.remove_job(str(schedule_id))
    except:
        print("Could not remove requested job from scheduler")
    scheduler.print_jobs()
    return dumps(delete_schedule(db, schedule_id))

@APP.route('/voucher/view/eatery', methods=['POST'])
def server_eatery_view_vouchers_and_schedules() -> str:
    """Given a select eatery id, returns voucher and schedule info in a dict if it
        exists in the database, otherwise throws an error.
    """
    data = request.get_json()
    eatery_id = check_valid_token(db, data.get('token'))['user_id']
    return dumps(get_vouchers_and_schedules(db, eatery_id))

@APP.route('/voucher/view/diner', methods=['POST'])
def server_diner_view_vouchers() -> str:
    """Views all active vouchers for a diner
    """
    data = request.get_json()
    diner_id = check_valid_token(db, data.get('token'))['user_id']
    return dumps(diner_view_vouchers(db, diner_id))


db = None
try:
    db = psycopg2.connect(
            database=config.database, user=config.user, password=config.password, host=config.host)
except psycopg2.Error as err:
        raise Exception("DB error: " + str(err)) from err
except Exception as err:
        raise Exception("Internal error: " + str(err)) from err

if __name__ == '__main__':
    signal.signal(signal.SIGTERM, close_db)
    signal.signal(signal.SIGINT, close_db)
    scheduler = BackgroundScheduler(job_defaults=job_defaults)
    scheduler.start()
    APP.run(port=config.port)