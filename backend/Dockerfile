FROM php:8.3-fpm-alpine

# Dependências do sistema
RUN apk add --no-cache \
    bash \
    git \
    curl \
    unzip \
    libzip-dev \
    libpng-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    icu-dev \
    oniguruma-dev \
    autoconf \
    g++ \
    make \
 && docker-php-ext-configure gd --with-freetype --with-jpeg \
 && docker-php-ext-install \
    pdo_mysql \
    pdo_sqlite \
    mbstring \
    zip \
    exif \
    pcntl \
    bcmath \
    gd \
    intl \
    opcache \
 && apk del autoconf g++ make

# Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# php.ini customizado é montado em runtime via docker-compose

WORKDIR /var/www/html

# Usuário com UID 1000 para alinhar com o host típico do WSL
RUN addgroup -g 1000 framily && adduser -D -u 1000 -G framily framily \
 && chown -R framily:framily /var/www/html

USER framily

EXPOSE 9000
CMD ["php-fpm"]
