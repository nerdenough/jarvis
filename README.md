Jarvis is a very simple personal assistant. It's probably not
much use to anyone but me at the moment!



Jarvis is a Python daemon which communicates with it's clients
via a REST interface.

It's clients include:

- HTTP: built-in, access at configured web_baseurl
- Android: see https://bitbucket.org/srynot4sale/jarvis-android


Dependencies:

- Python 2.5+
- MySQL
- MySQLdb - http://mysql-python.sourceforge.net/MySQLdb.html
- requests - http://docs.python-requests.org/en/latest/
- tornado - http://www.tornadoweb.org
- pytz - http://pytz.sourceforget.net
- tzlocal - http://github.com/regebro/tzlocal
- nose - https://pypi.python.org/pypi/nose/


Config file's (config.py) expected content:

    config = {}

    # Mandatory on production sites, prevent tests running
    # and potentially wiping all your data
    config['is_production']         = True

    # Optional, when set to True displays debugging data
    config['debug']                 = False

    # Database configuration. DB username is used as dbname
    config['database_host']         = 'localhost'
    config['database_username']     = 'jarvis'
    config['database_password']     = 'password'

    # Port to run server on
    config['interface_http_port']   = 'XXXX'

    # Passphrase for connecting to server
    config['secret']                = 'secrethash'

    # Timezone you'd prefer times displayed as in clients
    config['timezone']              = 'Pacific/Auckland'

    # Name that Jarvis will refer to you by
    config['username']              = 'My Name'

    # URL the web client is accessible at. Normally would be
    # those hostname/ip of server and the port defined earlier.
    # However, could be different if you are running the server
    # behind a proxy, e.g. apache for HTTPS
    config['web_baseurl']           = 'http://localhost:XXXX/'

    # Set the username/password for using the web client
    config['web_username']          = 'myusername'
    config['web_password']          = 'mypassword'


Database tables will be installed on first run.

Also requiring setup is the cron job, here is an example crontab:

    * * * * * jarvisuser cd /path/to/jarvis/checkout; ./cron.py;


Test suite can be run by evoking `nosetests` from the root jarvis directory.
