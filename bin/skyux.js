#!/usr/bin/env node
'use strict';

const rc = require('rc');
const updateNotifier = require('update-notifier');

const cli = require('../index');
const pkg = require('../package.json');
const notifier = updateNotifier({ pkg: pkg });

notifier.notify({ defer: false, isGlobal: true });
cli(rc('skyux', {}));
