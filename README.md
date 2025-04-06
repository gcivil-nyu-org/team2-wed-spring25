# Nightwalkers Repo

**Main:** [![Build Status](https://app.travis-ci.com/gcivil-nyu-org/team2-wed-spring25.svg?token=qXXqQBVVz5xbzNpep8Jg&branch=main)](https://app.travis-ci.com/gcivil-nyu-org/team2-wed-spring25)
[![Coverage Status](https://coveralls.io/repos/github/gcivil-nyu-org/team2-wed-spring25/badge.svg?branch=main)](https://coveralls.io/github/gcivil-nyu-org/team2-wed-spring25?branch=main)

**Develop:** [![Build Status](https://app.travis-ci.com/gcivil-nyu-org/team2-wed-spring25.svg?token=qXXqQBVVz5xbzNpep8Jg&branch=develop)](https://app.travis-ci.com/gcivil-nyu-org/team2-wed-spring25)
[![Coverage Status](https://coveralls.io/repos/github/gcivil-nyu-org/team2-wed-spring25/badge.svg?branch=develop)](https://coveralls.io/github/gcivil-nyu-org/team2-wed-spring25?branch=develop)

**Backend Local: **python3 manage.py runserver_plus --cert-file cert.pem --key-file key.pem

export DJANGO_SETTINGS_MODULE=nightwalkers.settings && python3 manage.py runserver_plus --cert-file cert.pem --key-file key.pem & daphne -e ssl:8001:privateKey=key.pem:certKey=cert.pem nightwalkers.asgi:application
\*\*Frontend Local:
\*\*- npm run build

- npm run dev

- install redis
- run backend and ws serer different command
