#!/usr/bin/env bash
set -o errexit

cd client
npm install
npm run build

cd ../server
npm install
npm start