#!/bin/sh
set -eu

mkdir -p \
    /home/data/assets \
    /var/www/html/storage/framework/cache/data \
    /var/www/html/storage/framework/sessions \
    /var/www/html/storage/framework/views \
    /var/www/html/storage/logs

touch /home/data/minizon.sqlite
ln -sfn /home/data/assets /var/www/html/public/storage

chown -R www-data:www-data \
    /home/data \
    /var/www/html/storage \
    /var/www/html/bootstrap/cache

php artisan migrate --force
php artisan package:discover --ansi

php-fpm -D
exec nginx -g "daemon off;"
