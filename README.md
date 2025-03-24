[![Build Status](https://app.travis-ci.com/gcivil-nyu-org/team2-wed-spring25.svg?branch=main)](https://app.travis-ci.com/gcivil-nyu-org/team2-wed-spring25)
[![Coverage Status](https://coveralls.io/repos/github/gcivil-nyu-org/team2-wed-spring25/badge.svg?branch=main)](https://coveralls.io/github/gcivil-nyu-org/team2-wed-spring25?branch=main)

Backend Local: python manage.py runserver_plus --cert-file cert.pem --key-file key.pem

TODO:

refactor user post bottom,
karma issue, current user = 0
image visibility issue post dialog
user must be login to access forum realted apis on frotned and backend.
repost delete option.
flake and black before commit.
refactor code,
filter for posts, by time, by likes,
=====
Done:
=====
fixed color change basec on incon for comment and like
report post
reply add directly first before setting
Xresponsive design.
pagination.
after point no nesting,
responsive comments,

create comment and immediately like it error as we are faking the comment id
direct post add and comment add has issues.
throttle not working.
report comment.
delte comment
newlty created commnet cant be replied,
setRepliesCount is not a function
setCommentsCount is not a function
delete post.
edit comment.
setCommentsCount, internal reply, reply to comment
edit post.
settings page - reacted posts
settings page - reported posts
settings page - created posts
settings page - commented posts
on submit comment, comment cannot be changed.
on submit post, post content cannot be changed.
fixed: on reply comment was getting added to its parent list as well as parents reply list.
