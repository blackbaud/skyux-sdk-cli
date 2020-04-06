const logger = require('@blackbaud/skyux-logger');
const findInFiles = require('find-in-files');
const fs = require('fs-extra');

const map = {
  'icons': [
    {
      'v4Name': '500px',
      'v5Name': '500px',
      'prefix': 'fab',
      'charCode': 'f26e'
    },
    {
      'v4Name': 'address-book-o',
      'v5Name': 'address-book',
      'prefix': 'far',
      'charCode': 'f2b9'
    },
    {
      'v4Name': 'address-card-o',
      'v5Name': 'address-card',
      'prefix': 'far',
      'charCode': 'f2bb'
    },
    {
      'v4Name': 'adn',
      'v5Name': 'adn',
      'prefix': 'fab',
      'charCode': 'f170'
    },
    {
      'v4Name': 'amazon',
      'v5Name': 'amazon',
      'prefix': 'fab',
      'charCode': 'f270'
    },
    {
      'v4Name': 'android',
      'v5Name': 'android',
      'prefix': 'fab',
      'charCode': 'f17b'
    },
    {
      'v4Name': 'angellist',
      'v5Name': 'angellist',
      'prefix': 'fab',
      'charCode': 'f209'
    },
    {
      'v4Name': 'apple',
      'v5Name': 'apple',
      'prefix': 'fab',
      'charCode': 'f179'
    },
    {
      'v4Name': 'area-chart',
      'v5Name': 'chart-area',
      'prefix': 'fas',
      'charCode': 'f1fe'
    },
    {
      'v4Name': 'arrow-circle-o-down',
      'v5Name': 'arrow-alt-circle-down',
      'prefix': 'far',
      'charCode': 'f358'
    },
    {
      'v4Name': 'arrow-circle-o-left',
      'v5Name': 'arrow-alt-circle-left',
      'prefix': 'far',
      'charCode': 'f359'
    },
    {
      'v4Name': 'arrow-circle-o-right',
      'v5Name': 'arrow-alt-circle-right',
      'prefix': 'far',
      'charCode': 'f35a'
    },
    {
      'v4Name': 'arrow-circle-o-up',
      'v5Name': 'arrow-alt-circle-up',
      'prefix': 'far',
      'charCode': 'f35b'
    },
    {
      'v4Name': 'arrows',
      'v5Name': 'arrows-alt',
      'prefix': 'fas',
      'charCode': 'f0b2'
    },
    {
      'v4Name': 'arrows-alt',
      'v5Name': 'expand-arrows-alt',
      'prefix': 'fas',
      'charCode': 'f31e'
    },
    {
      'v4Name': 'arrows-h',
      'v5Name': 'arrows-alt-h',
      'prefix': 'fas',
      'charCode': 'f337'
    },
    {
      'v4Name': 'arrows-v',
      'v5Name': 'arrows-alt-v',
      'prefix': 'fas',
      'charCode': 'f338'
    },
    {
      'v4Name': 'asl-interpreting',
      'v5Name': 'american-sign-language-interpreting',
      'prefix': 'fas',
      'charCode': 'f2a3'
    },
    {
      'v4Name': 'automobile',
      'v5Name': 'car',
      'prefix': 'fas',
      'charCode': 'f1b9'
    },
    {
      'v4Name': 'bandcamp',
      'v5Name': 'bandcamp',
      'prefix': 'fab',
      'charCode': 'f2d5'
    },
    {
      'v4Name': 'bank',
      'v5Name': 'university',
      'prefix': 'fas',
      'charCode': 'f19c'
    },
    {
      'v4Name': 'bar-chart',
      'v5Name': 'chart-bar',
      'prefix': 'far',
      'charCode': 'f080'
    },
    {
      'v4Name': 'bar-chart-o',
      'v5Name': 'chart-bar',
      'prefix': 'far',
      'charCode': 'f080'
    },
    {
      'v4Name': 'bathtub',
      'v5Name': 'bath',
      'prefix': 'fas',
      'charCode': 'f2cd'
    },
    {
      'v4Name': 'battery',
      'v5Name': 'battery-full',
      'prefix': 'fas',
      'charCode': 'f240'
    },
    {
      'v4Name': 'battery-0',
      'v5Name': 'battery-empty',
      'prefix': 'fas',
      'charCode': 'f244'
    },
    {
      'v4Name': 'battery-1',
      'v5Name': 'battery-quarter',
      'prefix': 'fas',
      'charCode': 'f243'
    },
    {
      'v4Name': 'battery-2',
      'v5Name': 'battery-half',
      'prefix': 'fas',
      'charCode': 'f242'
    },
    {
      'v4Name': 'battery-3',
      'v5Name': 'battery-three-quarters',
      'prefix': 'fas',
      'charCode': 'f241'
    },
    {
      'v4Name': 'battery-4',
      'v5Name': 'battery-full',
      'prefix': 'fas',
      'charCode': 'f240'
    },
    {
      'v4Name': 'behance',
      'v5Name': 'behance',
      'prefix': 'fab',
      'charCode': 'f1b4'
    },
    {
      'v4Name': 'behance-square',
      'v5Name': 'behance-square',
      'prefix': 'fab',
      'charCode': 'f1b5'
    },
    {
      'v4Name': 'bell-o',
      'v5Name': 'bell',
      'prefix': 'far',
      'charCode': 'f0f3'
    },
    {
      'v4Name': 'bell-slash-o',
      'v5Name': 'bell-slash',
      'prefix': 'far',
      'charCode': 'f1f6'
    },
    {
      'v4Name': 'bitbucket',
      'v5Name': 'bitbucket',
      'prefix': 'fab',
      'charCode': 'f171'
    },
    {
      'v4Name': 'bitbucket-square',
      'v5Name': 'bitbucket',
      'prefix': 'fab',
      'charCode': 'f171'
    },
    {
      'v4Name': 'bitcoin',
      'v5Name': 'btc',
      'prefix': 'fab',
      'charCode': 'f15a'
    },
    {
      'v4Name': 'black-tie',
      'v5Name': 'black-tie',
      'prefix': 'fab',
      'charCode': 'f27e'
    },
    {
      'v4Name': 'bluetooth',
      'v5Name': 'bluetooth',
      'prefix': 'fab',
      'charCode': 'f293'
    },
    {
      'v4Name': 'bluetooth-b',
      'v5Name': 'bluetooth-b',
      'prefix': 'fab',
      'charCode': 'f294'
    },
    {
      'v4Name': 'bookmark-o',
      'v5Name': 'bookmark',
      'prefix': 'far',
      'charCode': 'f02e'
    },
    {
      'v4Name': 'btc',
      'v5Name': 'btc',
      'prefix': 'fab',
      'charCode': 'f15a'
    },
    {
      'v4Name': 'building-o',
      'v5Name': 'building',
      'prefix': 'far',
      'charCode': 'f1ad'
    },
    {
      'v4Name': 'buysellads',
      'v5Name': 'buysellads',
      'prefix': 'fab',
      'charCode': 'f20d'
    },
    {
      'v4Name': 'cab',
      'v5Name': 'taxi',
      'prefix': 'fas',
      'charCode': 'f1ba'
    },
    {
      'v4Name': 'calendar',
      'v5Name': 'calendar-alt',
      'prefix': 'fas',
      'charCode': 'f073'
    },
    {
      'v4Name': 'calendar-check-o',
      'v5Name': 'calendar-check',
      'prefix': 'far',
      'charCode': 'f274'
    },
    {
      'v4Name': 'calendar-minus-o',
      'v5Name': 'calendar-minus',
      'prefix': 'far',
      'charCode': 'f272'
    },
    {
      'v4Name': 'calendar-o',
      'v5Name': 'calendar',
      'prefix': 'far',
      'charCode': 'f133'
    },
    {
      'v4Name': 'calendar-plus-o',
      'v5Name': 'calendar-plus',
      'prefix': 'far',
      'charCode': 'f271'
    },
    {
      'v4Name': 'calendar-times-o',
      'v5Name': 'calendar-times',
      'prefix': 'far',
      'charCode': 'f273'
    },
    {
      'v4Name': 'caret-square-o-down',
      'v5Name': 'caret-square-down',
      'prefix': 'far',
      'charCode': 'f150'
    },
    {
      'v4Name': 'caret-square-o-left',
      'v5Name': 'caret-square-left',
      'prefix': 'far',
      'charCode': 'f191'
    },
    {
      'v4Name': 'caret-square-o-right',
      'v5Name': 'caret-square-right',
      'prefix': 'far',
      'charCode': 'f152'
    },
    {
      'v4Name': 'caret-square-o-up',
      'v5Name': 'caret-square-up',
      'prefix': 'far',
      'charCode': 'f151'
    },
    {
      'v4Name': 'cc',
      'v5Name': 'closed-captioning',
      'prefix': 'far',
      'charCode': 'f20a'
    },
    {
      'v4Name': 'cc-amex',
      'v5Name': 'cc-amex',
      'prefix': 'fab',
      'charCode': 'f1f3'
    },
    {
      'v4Name': 'cc-diners-club',
      'v5Name': 'cc-diners-club',
      'prefix': 'fab',
      'charCode': 'f24c'
    },
    {
      'v4Name': 'cc-discover',
      'v5Name': 'cc-discover',
      'prefix': 'fab',
      'charCode': 'f1f2'
    },
    {
      'v4Name': 'cc-jcb',
      'v5Name': 'cc-jcb',
      'prefix': 'fab',
      'charCode': 'f24b'
    },
    {
      'v4Name': 'cc-mastercard',
      'v5Name': 'cc-mastercard',
      'prefix': 'fab',
      'charCode': 'f1f1'
    },
    {
      'v4Name': 'cc-paypal',
      'v5Name': 'cc-paypal',
      'prefix': 'fab',
      'charCode': 'f1f4'
    },
    {
      'v4Name': 'cc-stripe',
      'v5Name': 'cc-stripe',
      'prefix': 'fab',
      'charCode': 'f1f5'
    },
    {
      'v4Name': 'cc-visa',
      'v5Name': 'cc-visa',
      'prefix': 'fab',
      'charCode': 'f1f0'
    },
    {
      'v4Name': 'chain',
      'v5Name': 'link',
      'prefix': 'fas',
      'charCode': 'f0c1'
    },
    {
      'v4Name': 'chain-broken',
      'v5Name': 'unlink',
      'prefix': 'fas',
      'charCode': 'f127'
    },
    {
      'v4Name': 'check-circle-o',
      'v5Name': 'check-circle',
      'prefix': 'far',
      'charCode': 'f058'
    },
    {
      'v4Name': 'check-square-o',
      'v5Name': 'check-square',
      'prefix': 'far',
      'charCode': 'f14a'
    },
    {
      'v4Name': 'chrome',
      'v5Name': 'chrome',
      'prefix': 'fab',
      'charCode': 'f268'
    },
    {
      'v4Name': 'circle-o',
      'v5Name': 'circle',
      'prefix': 'far',
      'charCode': 'f111'
    },
    {
      'v4Name': 'circle-o-notch',
      'v5Name': 'circle-notch',
      'prefix': 'fas',
      'charCode': 'f1ce'
    },
    {
      'v4Name': 'circle-thin',
      'v5Name': 'circle',
      'prefix': 'far',
      'charCode': 'f111'
    },
    {
      'v4Name': 'clipboard',
      'v5Name': 'clipboard',
      'prefix': 'far',
      'charCode': 'f328'
    },
    {
      'v4Name': 'clock-o',
      'v5Name': 'clock',
      'prefix': 'far',
      'charCode': 'f017'
    },
    {
      'v4Name': 'clone',
      'v5Name': 'clone',
      'prefix': 'far',
      'charCode': 'f24d'
    },
    {
      'v4Name': 'close',
      'v5Name': 'times',
      'prefix': 'fas',
      'charCode': 'f00d'
    },
    {
      'v4Name': 'cloud-download',
      'v5Name': 'cloud-download-alt',
      'prefix': 'fas',
      'charCode': 'f381'
    },
    {
      'v4Name': 'cloud-upload',
      'v5Name': 'cloud-upload-alt',
      'prefix': 'fas',
      'charCode': 'f382'
    },
    {
      'v4Name': 'cny',
      'v5Name': 'yen-sign',
      'prefix': 'fas',
      'charCode': 'f157'
    },
    {
      'v4Name': 'code-fork',
      'v5Name': 'code-branch',
      'prefix': 'fas',
      'charCode': 'f126'
    },
    {
      'v4Name': 'codepen',
      'v5Name': 'codepen',
      'prefix': 'fab',
      'charCode': 'f1cb'
    },
    {
      'v4Name': 'codiepie',
      'v5Name': 'codiepie',
      'prefix': 'fab',
      'charCode': 'f284'
    },
    {
      'v4Name': 'comment-o',
      'v5Name': 'comment',
      'prefix': 'far',
      'charCode': 'f075'
    },
    {
      'v4Name': 'commenting',
      'v5Name': 'comment-dots',
      'prefix': 'fas',
      'charCode': 'f4ad'
    },
    {
      'v4Name': 'commenting-o',
      'v5Name': 'comment-dots',
      'prefix': 'far',
      'charCode': 'f4ad'
    },
    {
      'v4Name': 'comments-o',
      'v5Name': 'comments',
      'prefix': 'far',
      'charCode': 'f086'
    },
    {
      'v4Name': 'compass',
      'v5Name': 'compass',
      'prefix': 'far',
      'charCode': 'f14e'
    },
    {
      'v4Name': 'connectdevelop',
      'v5Name': 'connectdevelop',
      'prefix': 'fab',
      'charCode': 'f20e'
    },
    {
      'v4Name': 'contao',
      'v5Name': 'contao',
      'prefix': 'fab',
      'charCode': 'f26d'
    },
    {
      'v4Name': 'copyright',
      'v5Name': 'copyright',
      'prefix': 'far',
      'charCode': 'f1f9'
    },
    {
      'v4Name': 'creative-commons',
      'v5Name': 'creative-commons',
      'prefix': 'fab',
      'charCode': 'f25e'
    },
    {
      'v4Name': 'credit-card',
      'v5Name': 'credit-card',
      'prefix': 'far',
      'charCode': 'f09d'
    },
    {
      'v4Name': 'credit-card-alt',
      'v5Name': 'credit-card',
      'prefix': 'fas',
      'charCode': 'f09d'
    },
    {
      'v4Name': 'css3',
      'v5Name': 'css3',
      'prefix': 'fab',
      'charCode': 'f13c'
    },
    {
      'v4Name': 'cutlery',
      'v5Name': 'utensils',
      'prefix': 'fas',
      'charCode': 'f2e7'
    },
    {
      'v4Name': 'dashboard',
      'v5Name': 'tachometer-alt',
      'prefix': 'fas',
      'charCode': 'f3fd'
    },
    {
      'v4Name': 'dashcube',
      'v5Name': 'dashcube',
      'prefix': 'fab',
      'charCode': 'f210'
    },
    {
      'v4Name': 'deafness',
      'v5Name': 'deaf',
      'prefix': 'fas',
      'charCode': 'f2a4'
    },
    {
      'v4Name': 'dedent',
      'v5Name': 'outdent',
      'prefix': 'fas',
      'charCode': 'f03b'
    },
    {
      'v4Name': 'delicious',
      'v5Name': 'delicious',
      'prefix': 'fab',
      'charCode': 'f1a5'
    },
    {
      'v4Name': 'deviantart',
      'v5Name': 'deviantart',
      'prefix': 'fab',
      'charCode': 'f1bd'
    },
    {
      'v4Name': 'diamond',
      'v5Name': 'gem',
      'prefix': 'far',
      'charCode': 'f3a5'
    },
    {
      'v4Name': 'digg',
      'v5Name': 'digg',
      'prefix': 'fab',
      'charCode': 'f1a6'
    },
    {
      'v4Name': 'dollar',
      'v5Name': 'dollar-sign',
      'prefix': 'fas',
      'charCode': 'f155'
    },
    {
      'v4Name': 'dot-circle-o',
      'v5Name': 'dot-circle',
      'prefix': 'far',
      'charCode': 'f192'
    },
    {
      'v4Name': 'dribbble',
      'v5Name': 'dribbble',
      'prefix': 'fab',
      'charCode': 'f17d'
    },
    {
      'v4Name': 'drivers-license',
      'v5Name': 'id-card',
      'prefix': 'fas',
      'charCode': 'f2c2'
    },
    {
      'v4Name': 'drivers-license-o',
      'v5Name': 'id-card',
      'prefix': 'far',
      'charCode': 'f2c2'
    },
    {
      'v4Name': 'dropbox',
      'v5Name': 'dropbox',
      'prefix': 'fab',
      'charCode': 'f16b'
    },
    {
      'v4Name': 'drupal',
      'v5Name': 'drupal',
      'prefix': 'fab',
      'charCode': 'f1a9'
    },
    {
      'v4Name': 'edge',
      'v5Name': 'edge',
      'prefix': 'fab',
      'charCode': 'f282'
    },
    {
      'v4Name': 'eercast',
      'v5Name': 'sellcast',
      'prefix': 'fab',
      'charCode': 'f2da'
    },
    {
      'v4Name': 'empire',
      'v5Name': 'empire',
      'prefix': 'fab',
      'charCode': 'f1d1'
    },
    {
      'v4Name': 'envelope-o',
      'v5Name': 'envelope',
      'prefix': 'far',
      'charCode': 'f0e0'
    },
    {
      'v4Name': 'envelope-open-o',
      'v5Name': 'envelope-open',
      'prefix': 'far',
      'charCode': 'f2b6'
    },
    {
      'v4Name': 'envira',
      'v5Name': 'envira',
      'prefix': 'fab',
      'charCode': 'f299'
    },
    {
      'v4Name': 'etsy',
      'v5Name': 'etsy',
      'prefix': 'fab',
      'charCode': 'f2d7'
    },
    {
      'v4Name': 'eur',
      'v5Name': 'euro-sign',
      'prefix': 'fas',
      'charCode': 'f153'
    },
    {
      'v4Name': 'euro',
      'v5Name': 'euro-sign',
      'prefix': 'fas',
      'charCode': 'f153'
    },
    {
      'v4Name': 'exchange',
      'v5Name': 'exchange-alt',
      'prefix': 'fas',
      'charCode': 'f362'
    },
    {
      'v4Name': 'expeditedssl',
      'v5Name': 'expeditedssl',
      'prefix': 'fab',
      'charCode': 'f23e'
    },
    {
      'v4Name': 'external-link',
      'v5Name': 'external-link-alt',
      'prefix': 'fas',
      'charCode': 'f35d'
    },
    {
      'v4Name': 'external-link-square',
      'v5Name': 'external-link-square-alt',
      'prefix': 'fas',
      'charCode': 'f360'
    },
    {
      'v4Name': 'eye',
      'v5Name': 'eye',
      'prefix': 'far',
      'charCode': 'f06e'
    },
    {
      'v4Name': 'eye-slash',
      'v5Name': 'eye-slash',
      'prefix': 'far',
      'charCode': 'f070'
    },
    {
      'v4Name': 'eyedropper',
      'v5Name': 'eye-dropper',
      'prefix': 'fas',
      'charCode': 'f1fb'
    },
    {
      'v4Name': 'fa',
      'v5Name': 'font-awesome',
      'prefix': 'fab',
      'charCode': 'f2b4'
    },
    {
      'v4Name': 'facebook',
      'v5Name': 'facebook-f',
      'prefix': 'fab',
      'charCode': 'f39e'
    },
    {
      'v4Name': 'facebook-f',
      'v5Name': 'facebook-f',
      'prefix': 'fab',
      'charCode': 'f39e'
    },
    {
      'v4Name': 'facebook-official',
      'v5Name': 'facebook',
      'prefix': 'fab',
      'charCode': 'f09a'
    },
    {
      'v4Name': 'facebook-square',
      'v5Name': 'facebook-square',
      'prefix': 'fab',
      'charCode': 'f082'
    },
    {
      'v4Name': 'feed',
      'v5Name': 'rss',
      'prefix': 'fas',
      'charCode': 'f09e'
    },
    {
      'v4Name': 'file-archive-o',
      'v5Name': 'file-archive',
      'prefix': 'far',
      'charCode': 'f1c6'
    },
    {
      'v4Name': 'file-audio-o',
      'v5Name': 'file-audio',
      'prefix': 'far',
      'charCode': 'f1c7'
    },
    {
      'v4Name': 'file-code-o',
      'v5Name': 'file-code',
      'prefix': 'far',
      'charCode': 'f1c9'
    },
    {
      'v4Name': 'file-excel-o',
      'v5Name': 'file-excel',
      'prefix': 'far',
      'charCode': 'f1c3'
    },
    {
      'v4Name': 'file-image-o',
      'v5Name': 'file-image',
      'prefix': 'far',
      'charCode': 'f1c5'
    },
    {
      'v4Name': 'file-movie-o',
      'v5Name': 'file-video',
      'prefix': 'far',
      'charCode': 'f1c8'
    },
    {
      'v4Name': 'file-o',
      'v5Name': 'file',
      'prefix': 'far',
      'charCode': 'f15b'
    },
    {
      'v4Name': 'file-pdf-o',
      'v5Name': 'file-pdf',
      'prefix': 'far',
      'charCode': 'f1c1'
    },
    {
      'v4Name': 'file-photo-o',
      'v5Name': 'file-image',
      'prefix': 'far',
      'charCode': 'f1c5'
    },
    {
      'v4Name': 'file-picture-o',
      'v5Name': 'file-image',
      'prefix': 'far',
      'charCode': 'f1c5'
    },
    {
      'v4Name': 'file-powerpoint-o',
      'v5Name': 'file-powerpoint',
      'prefix': 'far',
      'charCode': 'f1c4'
    },
    {
      'v4Name': 'file-sound-o',
      'v5Name': 'file-audio',
      'prefix': 'far',
      'charCode': 'f1c7'
    },
    {
      'v4Name': 'file-text',
      'v5Name': 'file-alt',
      'prefix': 'fas',
      'charCode': 'f15c'
    },
    {
      'v4Name': 'file-text-o',
      'v5Name': 'file-alt',
      'prefix': 'far',
      'charCode': 'f15c'
    },
    {
      'v4Name': 'file-video-o',
      'v5Name': 'file-video',
      'prefix': 'far',
      'charCode': 'f1c8'
    },
    {
      'v4Name': 'file-word-o',
      'v5Name': 'file-word',
      'prefix': 'far',
      'charCode': 'f1c2'
    },
    {
      'v4Name': 'file-zip-o',
      'v5Name': 'file-archive',
      'prefix': 'far',
      'charCode': 'f1c6'
    },
    {
      'v4Name': 'files-o',
      'v5Name': 'copy',
      'prefix': 'far',
      'charCode': 'f0c5'
    },
    {
      'v4Name': 'firefox',
      'v5Name': 'firefox',
      'prefix': 'fab',
      'charCode': 'f269'
    },
    {
      'v4Name': 'first-order',
      'v5Name': 'first-order',
      'prefix': 'fab',
      'charCode': 'f2b0'
    },
    {
      'v4Name': 'flag-o',
      'v5Name': 'flag',
      'prefix': 'far',
      'charCode': 'f024'
    },
    {
      'v4Name': 'flash',
      'v5Name': 'bolt',
      'prefix': 'fas',
      'charCode': 'f0e7'
    },
    {
      'v4Name': 'flickr',
      'v5Name': 'flickr',
      'prefix': 'fab',
      'charCode': 'f16e'
    },
    {
      'v4Name': 'floppy-o',
      'v5Name': 'save',
      'prefix': 'far',
      'charCode': 'f0c7'
    },
    {
      'v4Name': 'folder-o',
      'v5Name': 'folder',
      'prefix': 'far',
      'charCode': 'f07b'
    },
    {
      'v4Name': 'folder-open-o',
      'v5Name': 'folder-open',
      'prefix': 'far',
      'charCode': 'f07c'
    },
    {
      'v4Name': 'font-awesome',
      'v5Name': 'font-awesome',
      'prefix': 'fab',
      'charCode': 'f2b4'
    },
    {
      'v4Name': 'fonticons',
      'v5Name': 'fonticons',
      'prefix': 'fab',
      'charCode': 'f280'
    },
    {
      'v4Name': 'fort-awesome',
      'v5Name': 'fort-awesome',
      'prefix': 'fab',
      'charCode': 'f286'
    },
    {
      'v4Name': 'forumbee',
      'v5Name': 'forumbee',
      'prefix': 'fab',
      'charCode': 'f211'
    },
    {
      'v4Name': 'foursquare',
      'v5Name': 'foursquare',
      'prefix': 'fab',
      'charCode': 'f180'
    },
    {
      'v4Name': 'free-code-camp',
      'v5Name': 'free-code-camp',
      'prefix': 'fab',
      'charCode': 'f2c5'
    },
    {
      'v4Name': 'frown-o',
      'v5Name': 'frown',
      'prefix': 'far',
      'charCode': 'f119'
    },
    {
      'v4Name': 'futbol-o',
      'v5Name': 'futbol',
      'prefix': 'far',
      'charCode': 'f1e3'
    },
    {
      'v4Name': 'gbp',
      'v5Name': 'pound-sign',
      'prefix': 'fas',
      'charCode': 'f154'
    },
    {
      'v4Name': 'ge',
      'v5Name': 'empire',
      'prefix': 'fab',
      'charCode': 'f1d1'
    },
    {
      'v4Name': 'gear',
      'v5Name': 'cog',
      'prefix': 'fas',
      'charCode': 'f013'
    },
    {
      'v4Name': 'gears',
      'v5Name': 'cogs',
      'prefix': 'fas',
      'charCode': 'f085'
    },
    {
      'v4Name': 'get-pocket',
      'v5Name': 'get-pocket',
      'prefix': 'fab',
      'charCode': 'f265'
    },
    {
      'v4Name': 'gg',
      'v5Name': 'gg',
      'prefix': 'fab',
      'charCode': 'f260'
    },
    {
      'v4Name': 'gg-circle',
      'v5Name': 'gg-circle',
      'prefix': 'fab',
      'charCode': 'f261'
    },
    {
      'v4Name': 'git',
      'v5Name': 'git',
      'prefix': 'fab',
      'charCode': 'f1d3'
    },
    {
      'v4Name': 'git-square',
      'v5Name': 'git-square',
      'prefix': 'fab',
      'charCode': 'f1d2'
    },
    {
      'v4Name': 'github',
      'v5Name': 'github',
      'prefix': 'fab',
      'charCode': 'f09b'
    },
    {
      'v4Name': 'github-alt',
      'v5Name': 'github-alt',
      'prefix': 'fab',
      'charCode': 'f113'
    },
    {
      'v4Name': 'github-square',
      'v5Name': 'github-square',
      'prefix': 'fab',
      'charCode': 'f092'
    },
    {
      'v4Name': 'gitlab',
      'v5Name': 'gitlab',
      'prefix': 'fab',
      'charCode': 'f296'
    },
    {
      'v4Name': 'gittip',
      'v5Name': 'gratipay',
      'prefix': 'fab',
      'charCode': 'f184'
    },
    {
      'v4Name': 'glass',
      'v5Name': 'glass-martini',
      'prefix': 'fas',
      'charCode': 'f000'
    },
    {
      'v4Name': 'glide',
      'v5Name': 'glide',
      'prefix': 'fab',
      'charCode': 'f2a5'
    },
    {
      'v4Name': 'glide-g',
      'v5Name': 'glide-g',
      'prefix': 'fab',
      'charCode': 'f2a6'
    },
    {
      'v4Name': 'google',
      'v5Name': 'google',
      'prefix': 'fab',
      'charCode': 'f1a0'
    },
    {
      'v4Name': 'google-plus',
      'v5Name': 'google-plus-g',
      'prefix': 'fab',
      'charCode': 'f0d5'
    },
    {
      'v4Name': 'google-plus-circle',
      'v5Name': 'google-plus',
      'prefix': 'fab',
      'charCode': 'f2b3'
    },
    {
      'v4Name': 'google-plus-official',
      'v5Name': 'google-plus',
      'prefix': 'fab',
      'charCode': 'f2b3'
    },
    {
      'v4Name': 'google-plus-square',
      'v5Name': 'google-plus-square',
      'prefix': 'fab',
      'charCode': 'f0d4'
    },
    {
      'v4Name': 'google-wallet',
      'v5Name': 'google-wallet',
      'prefix': 'fab',
      'charCode': 'f1ee'
    },
    {
      'v4Name': 'gratipay',
      'v5Name': 'gratipay',
      'prefix': 'fab',
      'charCode': 'f184'
    },
    {
      'v4Name': 'grav',
      'v5Name': 'grav',
      'prefix': 'fab',
      'charCode': 'f2d6'
    },
    {
      'v4Name': 'group',
      'v5Name': 'users',
      'prefix': 'fas',
      'charCode': 'f0c0'
    },
    {
      'v4Name': 'hacker-news',
      'v5Name': 'hacker-news',
      'prefix': 'fab',
      'charCode': 'f1d4'
    },
    {
      'v4Name': 'hand-grab-o',
      'v5Name': 'hand-rock',
      'prefix': 'far',
      'charCode': 'f255'
    },
    {
      'v4Name': 'hand-lizard-o',
      'v5Name': 'hand-lizard',
      'prefix': 'far',
      'charCode': 'f258'
    },
    {
      'v4Name': 'hand-o-down',
      'v5Name': 'hand-point-down',
      'prefix': 'far',
      'charCode': 'f0a7'
    },
    {
      'v4Name': 'hand-o-left',
      'v5Name': 'hand-point-left',
      'prefix': 'far',
      'charCode': 'f0a5'
    },
    {
      'v4Name': 'hand-o-right',
      'v5Name': 'hand-point-right',
      'prefix': 'far',
      'charCode': 'f0a4'
    },
    {
      'v4Name': 'hand-o-up',
      'v5Name': 'hand-point-up',
      'prefix': 'far',
      'charCode': 'f0a6'
    },
    {
      'v4Name': 'hand-paper-o',
      'v5Name': 'hand-paper',
      'prefix': 'far',
      'charCode': 'f256'
    },
    {
      'v4Name': 'hand-peace-o',
      'v5Name': 'hand-peace',
      'prefix': 'far',
      'charCode': 'f25b'
    },
    {
      'v4Name': 'hand-pointer-o',
      'v5Name': 'hand-pointer',
      'prefix': 'far',
      'charCode': 'f25a'
    },
    {
      'v4Name': 'hand-rock-o',
      'v5Name': 'hand-rock',
      'prefix': 'far',
      'charCode': 'f255'
    },
    {
      'v4Name': 'hand-scissors-o',
      'v5Name': 'hand-scissors',
      'prefix': 'far',
      'charCode': 'f257'
    },
    {
      'v4Name': 'hand-spock-o',
      'v5Name': 'hand-spock',
      'prefix': 'far',
      'charCode': 'f259'
    },
    {
      'v4Name': 'hand-stop-o',
      'v5Name': 'hand-paper',
      'prefix': 'far',
      'charCode': 'f256'
    },
    {
      'v4Name': 'handshake-o',
      'v5Name': 'handshake',
      'prefix': 'far',
      'charCode': 'f2b5'
    },
    {
      'v4Name': 'hard-of-hearing',
      'v5Name': 'deaf',
      'prefix': 'fas',
      'charCode': 'f2a4'
    },
    {
      'v4Name': 'hdd-o',
      'v5Name': 'hdd',
      'prefix': 'far',
      'charCode': 'f0a0'
    },
    {
      'v4Name': 'header',
      'v5Name': 'heading',
      'prefix': 'fas',
      'charCode': 'f1dc'
    },
    {
      'v4Name': 'heart-o',
      'v5Name': 'heart',
      'prefix': 'far',
      'charCode': 'f004'
    },
    {
      'v4Name': 'hospital-o',
      'v5Name': 'hospital',
      'prefix': 'far',
      'charCode': 'f0f8'
    },
    {
      'v4Name': 'hotel',
      'v5Name': 'bed',
      'prefix': 'fas',
      'charCode': 'f236'
    },
    {
      'v4Name': 'hourglass-1',
      'v5Name': 'hourglass-start',
      'prefix': 'fas',
      'charCode': 'f251'
    },
    {
      'v4Name': 'hourglass-2',
      'v5Name': 'hourglass-half',
      'prefix': 'fas',
      'charCode': 'f252'
    },
    {
      'v4Name': 'hourglass-3',
      'v5Name': 'hourglass-end',
      'prefix': 'fas',
      'charCode': 'f253'
    },
    {
      'v4Name': 'hourglass-o',
      'v5Name': 'hourglass',
      'prefix': 'far',
      'charCode': 'f254'
    },
    {
      'v4Name': 'houzz',
      'v5Name': 'houzz',
      'prefix': 'fab',
      'charCode': 'f27c'
    },
    {
      'v4Name': 'html5',
      'v5Name': 'html5',
      'prefix': 'fab',
      'charCode': 'f13b'
    },
    {
      'v4Name': 'id-badge',
      'v5Name': 'id-badge',
      'prefix': 'far',
      'charCode': 'f2c1'
    },
    {
      'v4Name': 'id-card-o',
      'v5Name': 'id-card',
      'prefix': 'far',
      'charCode': 'f2c2'
    },
    {
      'v4Name': 'ils',
      'v5Name': 'shekel-sign',
      'prefix': 'fas',
      'charCode': 'f20b'
    },
    {
      'v4Name': 'image',
      'v5Name': 'image',
      'prefix': 'far',
      'charCode': 'f03e'
    },
    {
      'v4Name': 'imdb',
      'v5Name': 'imdb',
      'prefix': 'fab',
      'charCode': 'f2d8'
    },
    {
      'v4Name': 'inr',
      'v5Name': 'rupee-sign',
      'prefix': 'fas',
      'charCode': 'f156'
    },
    {
      'v4Name': 'instagram',
      'v5Name': 'instagram',
      'prefix': 'fab',
      'charCode': 'f16d'
    },
    {
      'v4Name': 'institution',
      'v5Name': 'university',
      'prefix': 'fas',
      'charCode': 'f19c'
    },
    {
      'v4Name': 'internet-explorer',
      'v5Name': 'internet-explorer',
      'prefix': 'fab',
      'charCode': 'f26b'
    },
    {
      'v4Name': 'intersex',
      'v5Name': 'transgender',
      'prefix': 'fas',
      'charCode': 'f224'
    },
    {
      'v4Name': 'ioxhost',
      'v5Name': 'ioxhost',
      'prefix': 'fab',
      'charCode': 'f208'
    },
    {
      'v4Name': 'joomla',
      'v5Name': 'joomla',
      'prefix': 'fab',
      'charCode': 'f1aa'
    },
    {
      'v4Name': 'jpy',
      'v5Name': 'yen-sign',
      'prefix': 'fas',
      'charCode': 'f157'
    },
    {
      'v4Name': 'jsfiddle',
      'v5Name': 'jsfiddle',
      'prefix': 'fab',
      'charCode': 'f1cc'
    },
    {
      'v4Name': 'keyboard-o',
      'v5Name': 'keyboard',
      'prefix': 'far',
      'charCode': 'f11c'
    },
    {
      'v4Name': 'krw',
      'v5Name': 'won-sign',
      'prefix': 'fas',
      'charCode': 'f159'
    },
    {
      'v4Name': 'lastfm',
      'v5Name': 'lastfm',
      'prefix': 'fab',
      'charCode': 'f202'
    },
    {
      'v4Name': 'lastfm-square',
      'v5Name': 'lastfm-square',
      'prefix': 'fab',
      'charCode': 'f203'
    },
    {
      'v4Name': 'leanpub',
      'v5Name': 'leanpub',
      'prefix': 'fab',
      'charCode': 'f212'
    },
    {
      'v4Name': 'legal',
      'v5Name': 'gavel',
      'prefix': 'fas',
      'charCode': 'f0e3'
    },
    {
      'v4Name': 'lemon-o',
      'v5Name': 'lemon',
      'prefix': 'far',
      'charCode': 'f094'
    },
    {
      'v4Name': 'level-down',
      'v5Name': 'level-down-alt',
      'prefix': 'fas',
      'charCode': 'f3be'
    },
    {
      'v4Name': 'level-up',
      'v5Name': 'level-up-alt',
      'prefix': 'fas',
      'charCode': 'f3bf'
    },
    {
      'v4Name': 'life-bouy',
      'v5Name': 'life-ring',
      'prefix': 'far',
      'charCode': 'f1cd'
    },
    {
      'v4Name': 'life-buoy',
      'v5Name': 'life-ring',
      'prefix': 'far',
      'charCode': 'f1cd'
    },
    {
      'v4Name': 'life-ring',
      'v5Name': 'life-ring',
      'prefix': 'far',
      'charCode': 'f1cd'
    },
    {
      'v4Name': 'life-saver',
      'v5Name': 'life-ring',
      'prefix': 'far',
      'charCode': 'f1cd'
    },
    {
      'v4Name': 'lightbulb-o',
      'v5Name': 'lightbulb',
      'prefix': 'far',
      'charCode': 'f0eb'
    },
    {
      'v4Name': 'line-chart',
      'v5Name': 'chart-line',
      'prefix': 'fas',
      'charCode': 'f201'
    },
    {
      'v4Name': 'linkedin',
      'v5Name': 'linkedin-in',
      'prefix': 'fab',
      'charCode': 'f0e1'
    },
    {
      'v4Name': 'linkedin-square',
      'v5Name': 'linkedin',
      'prefix': 'fab',
      'charCode': 'f08c'
    },
    {
      'v4Name': 'linode',
      'v5Name': 'linode',
      'prefix': 'fab',
      'charCode': 'f2b8'
    },
    {
      'v4Name': 'linux',
      'v5Name': 'linux',
      'prefix': 'fab',
      'charCode': 'f17c'
    },
    {
      'v4Name': 'list-alt',
      'v5Name': 'list-alt',
      'prefix': 'far',
      'charCode': 'f022'
    },
    {
      'v4Name': 'long-arrow-down',
      'v5Name': 'long-arrow-alt-down',
      'prefix': 'fas',
      'charCode': 'f309'
    },
    {
      'v4Name': 'long-arrow-left',
      'v5Name': 'long-arrow-alt-left',
      'prefix': 'fas',
      'charCode': 'f30a'
    },
    {
      'v4Name': 'long-arrow-right',
      'v5Name': 'long-arrow-alt-right',
      'prefix': 'fas',
      'charCode': 'f30b'
    },
    {
      'v4Name': 'long-arrow-up',
      'v5Name': 'long-arrow-alt-up',
      'prefix': 'fas',
      'charCode': 'f30c'
    },
    {
      'v4Name': 'mail-forward',
      'v5Name': 'share',
      'prefix': 'fas',
      'charCode': 'f064'
    },
    {
      'v4Name': 'mail-reply',
      'v5Name': 'reply',
      'prefix': 'fas',
      'charCode': 'f3e5'
    },
    {
      'v4Name': 'mail-reply-all',
      'v5Name': 'reply-all',
      'prefix': 'fas',
      'charCode': 'f122'
    },
    {
      'v4Name': 'map-marker',
      'v5Name': 'map-marker-alt',
      'prefix': 'fas',
      'charCode': 'f3c5'
    },
    {
      'v4Name': 'map-o',
      'v5Name': 'map',
      'prefix': 'far',
      'charCode': 'f279'
    },
    {
      'v4Name': 'maxcdn',
      'v5Name': 'maxcdn',
      'prefix': 'fab',
      'charCode': 'f136'
    },
    {
      'v4Name': 'meanpath',
      'v5Name': 'font-awesome',
      'prefix': 'fab',
      'charCode': 'f2b4'
    },
    {
      'v4Name': 'medium',
      'v5Name': 'medium',
      'prefix': 'fab',
      'charCode': 'f23a'
    },
    {
      'v4Name': 'meetup',
      'v5Name': 'meetup',
      'prefix': 'fab',
      'charCode': 'f2e0'
    },
    {
      'v4Name': 'meh-o',
      'v5Name': 'meh',
      'prefix': 'far',
      'charCode': 'f11a'
    },
    {
      'v4Name': 'minus-square-o',
      'v5Name': 'minus-square',
      'prefix': 'far',
      'charCode': 'f146'
    },
    {
      'v4Name': 'mixcloud',
      'v5Name': 'mixcloud',
      'prefix': 'fab',
      'charCode': 'f289'
    },
    {
      'v4Name': 'mobile',
      'v5Name': 'mobile-alt',
      'prefix': 'fas',
      'charCode': 'f3cd'
    },
    {
      'v4Name': 'mobile-phone',
      'v5Name': 'mobile-alt',
      'prefix': 'fas',
      'charCode': 'f3cd'
    },
    {
      'v4Name': 'modx',
      'v5Name': 'modx',
      'prefix': 'fab',
      'charCode': 'f285'
    },
    {
      'v4Name': 'money',
      'v5Name': 'money-bill-alt',
      'prefix': 'far',
      'charCode': 'f3d1'
    },
    {
      'v4Name': 'moon-o',
      'v5Name': 'moon',
      'prefix': 'far',
      'charCode': 'f186'
    },
    {
      'v4Name': 'mortar-board',
      'v5Name': 'graduation-cap',
      'prefix': 'fas',
      'charCode': 'f19d'
    },
    {
      'v4Name': 'navicon',
      'v5Name': 'bars',
      'prefix': 'fas',
      'charCode': 'f0c9'
    },
    {
      'v4Name': 'newspaper-o',
      'v5Name': 'newspaper',
      'prefix': 'far',
      'charCode': 'f1ea'
    },
    {
      'v4Name': 'object-group',
      'v5Name': 'object-group',
      'prefix': 'far',
      'charCode': 'f247'
    },
    {
      'v4Name': 'object-ungroup',
      'v5Name': 'object-ungroup',
      'prefix': 'far',
      'charCode': 'f248'
    },
    {
      'v4Name': 'odnoklassniki',
      'v5Name': 'odnoklassniki',
      'prefix': 'fab',
      'charCode': 'f263'
    },
    {
      'v4Name': 'odnoklassniki-square',
      'v5Name': 'odnoklassniki-square',
      'prefix': 'fab',
      'charCode': 'f264'
    },
    {
      'v4Name': 'opencart',
      'v5Name': 'opencart',
      'prefix': 'fab',
      'charCode': 'f23d'
    },
    {
      'v4Name': 'openid',
      'v5Name': 'openid',
      'prefix': 'fab',
      'charCode': 'f19b'
    },
    {
      'v4Name': 'opera',
      'v5Name': 'opera',
      'prefix': 'fab',
      'charCode': 'f26a'
    },
    {
      'v4Name': 'optin-monster',
      'v5Name': 'optin-monster',
      'prefix': 'fab',
      'charCode': 'f23c'
    },
    {
      'v4Name': 'pagelines',
      'v5Name': 'pagelines',
      'prefix': 'fab',
      'charCode': 'f18c'
    },
    {
      'v4Name': 'paper-plane-o',
      'v5Name': 'paper-plane',
      'prefix': 'far',
      'charCode': 'f1d8'
    },
    {
      'v4Name': 'paste',
      'v5Name': 'clipboard',
      'prefix': 'far',
      'charCode': 'f328'
    },
    {
      'v4Name': 'pause-circle-o',
      'v5Name': 'pause-circle',
      'prefix': 'far',
      'charCode': 'f28b'
    },
    {
      'v4Name': 'paypal',
      'v5Name': 'paypal',
      'prefix': 'fab',
      'charCode': 'f1ed'
    },
    {
      'v4Name': 'pencil',
      'v5Name': 'pencil-alt',
      'prefix': 'fas',
      'charCode': 'f303'
    },
    {
      'v4Name': 'pencil-square',
      'v5Name': 'pen-square',
      'prefix': 'fas',
      'charCode': 'f14b'
    },
    {
      'v4Name': 'pencil-square-o',
      'v5Name': 'edit',
      'prefix': 'far',
      'charCode': 'f044'
    },
    {
      'v4Name': 'photo',
      'v5Name': 'image',
      'prefix': 'far',
      'charCode': 'f03e'
    },
    {
      'v4Name': 'picture-o',
      'v5Name': 'image',
      'prefix': 'far',
      'charCode': 'f03e'
    },
    {
      'v4Name': 'pie-chart',
      'v5Name': 'chart-pie',
      'prefix': 'fas',
      'charCode': 'f200'
    },
    {
      'v4Name': 'pied-piper',
      'v5Name': 'pied-piper',
      'prefix': 'fab',
      'charCode': 'f2ae'
    },
    {
      'v4Name': 'pied-piper-alt',
      'v5Name': 'pied-piper-alt',
      'prefix': 'fab',
      'charCode': 'f1a8'
    },
    {
      'v4Name': 'pied-piper-pp',
      'v5Name': 'pied-piper-pp',
      'prefix': 'fab',
      'charCode': 'f1a7'
    },
    {
      'v4Name': 'pinterest',
      'v5Name': 'pinterest',
      'prefix': 'fab',
      'charCode': 'f0d2'
    },
    {
      'v4Name': 'pinterest-p',
      'v5Name': 'pinterest-p',
      'prefix': 'fab',
      'charCode': 'f231'
    },
    {
      'v4Name': 'pinterest-square',
      'v5Name': 'pinterest-square',
      'prefix': 'fab',
      'charCode': 'f0d3'
    },
    {
      'v4Name': 'play-circle-o',
      'v5Name': 'play-circle',
      'prefix': 'far',
      'charCode': 'f144'
    },
    {
      'v4Name': 'plus-square-o',
      'v5Name': 'plus-square',
      'prefix': 'far',
      'charCode': 'f0fe'
    },
    {
      'v4Name': 'product-hunt',
      'v5Name': 'product-hunt',
      'prefix': 'fab',
      'charCode': 'f288'
    },
    {
      'v4Name': 'qq',
      'v5Name': 'qq',
      'prefix': 'fab',
      'charCode': 'f1d6'
    },
    {
      'v4Name': 'question-circle-o',
      'v5Name': 'question-circle',
      'prefix': 'far',
      'charCode': 'f059'
    },
    {
      'v4Name': 'quora',
      'v5Name': 'quora',
      'prefix': 'fab',
      'charCode': 'f2c4'
    },
    {
      'v4Name': 'ra',
      'v5Name': 'rebel',
      'prefix': 'fab',
      'charCode': 'f1d0'
    },
    {
      'v4Name': 'ravelry',
      'v5Name': 'ravelry',
      'prefix': 'fab',
      'charCode': 'f2d9'
    },
    {
      'v4Name': 'rebel',
      'v5Name': 'rebel',
      'prefix': 'fab',
      'charCode': 'f1d0'
    },
    {
      'v4Name': 'reddit',
      'v5Name': 'reddit',
      'prefix': 'fab',
      'charCode': 'f1a1'
    },
    {
      'v4Name': 'reddit-alien',
      'v5Name': 'reddit-alien',
      'prefix': 'fab',
      'charCode': 'f281'
    },
    {
      'v4Name': 'reddit-square',
      'v5Name': 'reddit-square',
      'prefix': 'fab',
      'charCode': 'f1a2'
    },
    {
      'v4Name': 'refresh',
      'v5Name': 'sync',
      'prefix': 'fas',
      'charCode': 'f021'
    },
    {
      'v4Name': 'registered',
      'v5Name': 'registered',
      'prefix': 'far',
      'charCode': 'f25d'
    },
    {
      'v4Name': 'remove',
      'v5Name': 'times',
      'prefix': 'fas',
      'charCode': 'f00d'
    },
    {
      'v4Name': 'renren',
      'v5Name': 'renren',
      'prefix': 'fab',
      'charCode': 'f18b'
    },
    {
      'v4Name': 'reorder',
      'v5Name': 'bars',
      'prefix': 'fas',
      'charCode': 'f0c9'
    },
    {
      'v4Name': 'repeat',
      'v5Name': 'redo',
      'prefix': 'fas',
      'charCode': 'f01e'
    },
    {
      'v4Name': 'resistance',
      'v5Name': 'rebel',
      'prefix': 'fab',
      'charCode': 'f1d0'
    },
    {
      'v4Name': 'rmb',
      'v5Name': 'yen-sign',
      'prefix': 'fas',
      'charCode': 'f157'
    },
    {
      'v4Name': 'rotate-left',
      'v5Name': 'undo',
      'prefix': 'fas',
      'charCode': 'f0e2'
    },
    {
      'v4Name': 'rotate-right',
      'v5Name': 'redo',
      'prefix': 'fas',
      'charCode': 'f01e'
    },
    {
      'v4Name': 'rouble',
      'v5Name': 'ruble-sign',
      'prefix': 'fas',
      'charCode': 'f158'
    },
    {
      'v4Name': 'rub',
      'v5Name': 'ruble-sign',
      'prefix': 'fas',
      'charCode': 'f158'
    },
    {
      'v4Name': 'ruble',
      'v5Name': 'ruble-sign',
      'prefix': 'fas',
      'charCode': 'f158'
    },
    {
      'v4Name': 'rupee',
      'v5Name': 'rupee-sign',
      'prefix': 'fas',
      'charCode': 'f156'
    },
    {
      'v4Name': 's15',
      'v5Name': 'bath',
      'prefix': 'fas',
      'charCode': 'f2cd'
    },
    {
      'v4Name': 'safari',
      'v5Name': 'safari',
      'prefix': 'fab',
      'charCode': 'f267'
    },
    {
      'v4Name': 'scissors',
      'v5Name': 'cut',
      'prefix': 'fas',
      'charCode': 'f0c4'
    },
    {
      'v4Name': 'scribd',
      'v5Name': 'scribd',
      'prefix': 'fab',
      'charCode': 'f28a'
    },
    {
      'v4Name': 'sellsy',
      'v5Name': 'sellsy',
      'prefix': 'fab',
      'charCode': 'f213'
    },
    {
      'v4Name': 'send',
      'v5Name': 'paper-plane',
      'prefix': 'fas',
      'charCode': 'f1d8'
    },
    {
      'v4Name': 'send-o',
      'v5Name': 'paper-plane',
      'prefix': 'far',
      'charCode': 'f1d8'
    },
    {
      'v4Name': 'share-square-o',
      'v5Name': 'share-square',
      'prefix': 'far',
      'charCode': 'f14d'
    },
    {
      'v4Name': 'shekel',
      'v5Name': 'shekel-sign',
      'prefix': 'fas',
      'charCode': 'f20b'
    },
    {
      'v4Name': 'sheqel',
      'v5Name': 'shekel-sign',
      'prefix': 'fas',
      'charCode': 'f20b'
    },
    {
      'v4Name': 'shield',
      'v5Name': 'shield-alt',
      'prefix': 'fas',
      'charCode': 'f3ed'
    },
    {
      'v4Name': 'shirtsinbulk',
      'v5Name': 'shirtsinbulk',
      'prefix': 'fab',
      'charCode': 'f214'
    },
    {
      'v4Name': 'sign-in',
      'v5Name': 'sign-in-alt',
      'prefix': 'fas',
      'charCode': 'f2f6'
    },
    {
      'v4Name': 'sign-out',
      'v5Name': 'sign-out-alt',
      'prefix': 'fas',
      'charCode': 'f2f5'
    },
    {
      'v4Name': 'signing',
      'v5Name': 'sign-language',
      'prefix': 'fas',
      'charCode': 'f2a7'
    },
    {
      'v4Name': 'simplybuilt',
      'v5Name': 'simplybuilt',
      'prefix': 'fab',
      'charCode': 'f215'
    },
    {
      'v4Name': 'skyatlas',
      'v5Name': 'skyatlas',
      'prefix': 'fab',
      'charCode': 'f216'
    },
    {
      'v4Name': 'skype',
      'v5Name': 'skype',
      'prefix': 'fab',
      'charCode': 'f17e'
    },
    {
      'v4Name': 'slack',
      'v5Name': 'slack',
      'prefix': 'fab',
      'charCode': 'f198'
    },
    {
      'v4Name': 'sliders',
      'v5Name': 'sliders-h',
      'prefix': 'fas',
      'charCode': 'f1de'
    },
    {
      'v4Name': 'slideshare',
      'v5Name': 'slideshare',
      'prefix': 'fab',
      'charCode': 'f1e7'
    },
    {
      'v4Name': 'smile-o',
      'v5Name': 'smile',
      'prefix': 'far',
      'charCode': 'f118'
    },
    {
      'v4Name': 'snapchat',
      'v5Name': 'snapchat',
      'prefix': 'fab',
      'charCode': 'f2ab'
    },
    {
      'v4Name': 'snapchat-ghost',
      'v5Name': 'snapchat-ghost',
      'prefix': 'fab',
      'charCode': 'f2ac'
    },
    {
      'v4Name': 'snapchat-square',
      'v5Name': 'snapchat-square',
      'prefix': 'fab',
      'charCode': 'f2ad'
    },
    {
      'v4Name': 'snowflake-o',
      'v5Name': 'snowflake',
      'prefix': 'far',
      'charCode': 'f2dc'
    },
    {
      'v4Name': 'soccer-ball-o',
      'v5Name': 'futbol',
      'prefix': 'far',
      'charCode': 'f1e3'
    },
    {
      'v4Name': 'sort-alpha-asc',
      'v5Name': 'sort-alpha-down',
      'prefix': 'fas',
      'charCode': 'f15d'
    },
    {
      'v4Name': 'sort-alpha-desc',
      'v5Name': 'sort-alpha-up',
      'prefix': 'fas',
      'charCode': 'f15e'
    },
    {
      'v4Name': 'sort-amount-asc',
      'v5Name': 'sort-amount-down',
      'prefix': 'fas',
      'charCode': 'f160'
    },
    {
      'v4Name': 'sort-amount-desc',
      'v5Name': 'sort-amount-up',
      'prefix': 'fas',
      'charCode': 'f161'
    },
    {
      'v4Name': 'sort-asc',
      'v5Name': 'sort-up',
      'prefix': 'fas',
      'charCode': 'f0de'
    },
    {
      'v4Name': 'sort-desc',
      'v5Name': 'sort-down',
      'prefix': 'fas',
      'charCode': 'f0dd'
    },
    {
      'v4Name': 'sort-numeric-asc',
      'v5Name': 'sort-numeric-down',
      'prefix': 'fas',
      'charCode': 'f162'
    },
    {
      'v4Name': 'sort-numeric-desc',
      'v5Name': 'sort-numeric-up',
      'prefix': 'fas',
      'charCode': 'f163'
    },
    {
      'v4Name': 'soundcloud',
      'v5Name': 'soundcloud',
      'prefix': 'fab',
      'charCode': 'f1be'
    },
    {
      'v4Name': 'spoon',
      'v5Name': 'utensil-spoon',
      'prefix': 'fas',
      'charCode': 'f2e5'
    },
    {
      'v4Name': 'spotify',
      'v5Name': 'spotify',
      'prefix': 'fab',
      'charCode': 'f1bc'
    },
    {
      'v4Name': 'square-o',
      'v5Name': 'square',
      'prefix': 'far',
      'charCode': 'f0c8'
    },
    {
      'v4Name': 'stack-exchange',
      'v5Name': 'stack-exchange',
      'prefix': 'fab',
      'charCode': 'f18d'
    },
    {
      'v4Name': 'stack-overflow',
      'v5Name': 'stack-overflow',
      'prefix': 'fab',
      'charCode': 'f16c'
    },
    {
      'v4Name': 'star-half-empty',
      'v5Name': 'star-half',
      'prefix': 'far',
      'charCode': 'f089'
    },
    {
      'v4Name': 'star-half-full',
      'v5Name': 'star-half',
      'prefix': 'far',
      'charCode': 'f089'
    },
    {
      'v4Name': 'star-half-o',
      'v5Name': 'star-half',
      'prefix': 'far',
      'charCode': 'f089'
    },
    {
      'v4Name': 'star-o',
      'v5Name': 'star',
      'prefix': 'far',
      'charCode': 'f005'
    },
    {
      'v4Name': 'steam',
      'v5Name': 'steam',
      'prefix': 'fab',
      'charCode': 'f1b6'
    },
    {
      'v4Name': 'steam-square',
      'v5Name': 'steam-square',
      'prefix': 'fab',
      'charCode': 'f1b7'
    },
    {
      'v4Name': 'sticky-note-o',
      'v5Name': 'sticky-note',
      'prefix': 'far',
      'charCode': 'f249'
    },
    {
      'v4Name': 'stop-circle-o',
      'v5Name': 'stop-circle',
      'prefix': 'far',
      'charCode': 'f28d'
    },
    {
      'v4Name': 'stumbleupon',
      'v5Name': 'stumbleupon',
      'prefix': 'fab',
      'charCode': 'f1a4'
    },
    {
      'v4Name': 'stumbleupon-circle',
      'v5Name': 'stumbleupon-circle',
      'prefix': 'fab',
      'charCode': 'f1a3'
    },
    {
      'v4Name': 'sun-o',
      'v5Name': 'sun',
      'prefix': 'far',
      'charCode': 'f185'
    },
    {
      'v4Name': 'superpowers',
      'v5Name': 'superpowers',
      'prefix': 'fab',
      'charCode': 'f2dd'
    },
    {
      'v4Name': 'support',
      'v5Name': 'life-ring',
      'prefix': 'far',
      'charCode': 'f1cd'
    },
    {
      'v4Name': 'tablet',
      'v5Name': 'tablet-alt',
      'prefix': 'fas',
      'charCode': 'f3fa'
    },
    {
      'v4Name': 'tachometer',
      'v5Name': 'tachometer-alt',
      'prefix': 'fas',
      'charCode': 'f3fd'
    },
    {
      'v4Name': 'telegram',
      'v5Name': 'telegram',
      'prefix': 'fab',
      'charCode': 'f2c6'
    },
    {
      'v4Name': 'television',
      'v5Name': 'tv',
      'prefix': 'fas',
      'charCode': 'f26c'
    },
    {
      'v4Name': 'tencent-weibo',
      'v5Name': 'tencent-weibo',
      'prefix': 'fab',
      'charCode': 'f1d5'
    },
    {
      'v4Name': 'themeisle',
      'v5Name': 'themeisle',
      'prefix': 'fab',
      'charCode': 'f2b2'
    },
    {
      'v4Name': 'thermometer',
      'v5Name': 'thermometer-full',
      'prefix': 'fas',
      'charCode': 'f2c7'
    },
    {
      'v4Name': 'thermometer-0',
      'v5Name': 'thermometer-empty',
      'prefix': 'fas',
      'charCode': 'f2cb'
    },
    {
      'v4Name': 'thermometer-1',
      'v5Name': 'thermometer-quarter',
      'prefix': 'fas',
      'charCode': 'f2ca'
    },
    {
      'v4Name': 'thermometer-2',
      'v5Name': 'thermometer-half',
      'prefix': 'fas',
      'charCode': 'f2c9'
    },
    {
      'v4Name': 'thermometer-3',
      'v5Name': 'thermometer-three-quarters',
      'prefix': 'fas',
      'charCode': 'f2c8'
    },
    {
      'v4Name': 'thermometer-4',
      'v5Name': 'thermometer-full',
      'prefix': 'fas',
      'charCode': 'f2c7'
    },
    {
      'v4Name': 'thumb-tack',
      'v5Name': 'thumbtack',
      'prefix': 'fas',
      'charCode': 'f08d'
    },
    {
      'v4Name': 'thumbs-o-down',
      'v5Name': 'thumbs-down',
      'prefix': 'far',
      'charCode': 'f165'
    },
    {
      'v4Name': 'thumbs-o-up',
      'v5Name': 'thumbs-up',
      'prefix': 'far',
      'charCode': 'f164'
    },
    {
      'v4Name': 'ticket',
      'v5Name': 'ticket-alt',
      'prefix': 'fas',
      'charCode': 'f3ff'
    },
    {
      'v4Name': 'times-circle-o',
      'v5Name': 'times-circle',
      'prefix': 'far',
      'charCode': 'f057'
    },
    {
      'v4Name': 'times-rectangle',
      'v5Name': 'window-close',
      'prefix': 'fas',
      'charCode': 'f410'
    },
    {
      'v4Name': 'times-rectangle-o',
      'v5Name': 'window-close',
      'prefix': 'far',
      'charCode': 'f410'
    },
    {
      'v4Name': 'toggle-down',
      'v5Name': 'caret-square-down',
      'prefix': 'far',
      'charCode': 'f150'
    },
    {
      'v4Name': 'toggle-left',
      'v5Name': 'caret-square-left',
      'prefix': 'far',
      'charCode': 'f191'
    },
    {
      'v4Name': 'toggle-right',
      'v5Name': 'caret-square-right',
      'prefix': 'far',
      'charCode': 'f152'
    },
    {
      'v4Name': 'toggle-up',
      'v5Name': 'caret-square-up',
      'prefix': 'far',
      'charCode': 'f151'
    },
    {
      'v4Name': 'trash',
      'v5Name': 'trash-alt',
      'prefix': 'fas',
      'charCode': 'f2ed'
    },
    {
      'v4Name': 'trash-o',
      'v5Name': 'trash-alt',
      'prefix': 'far',
      'charCode': 'f2ed'
    },
    {
      'v4Name': 'trello',
      'v5Name': 'trello',
      'prefix': 'fab',
      'charCode': 'f181'
    },
    {
      'v4Name': 'tripadvisor',
      'v5Name': 'tripadvisor',
      'prefix': 'fab',
      'charCode': 'f262'
    },
    {
      'v4Name': 'try',
      'v5Name': 'lira-sign',
      'prefix': 'fas',
      'charCode': 'f195'
    },
    {
      'v4Name': 'tumblr',
      'v5Name': 'tumblr',
      'prefix': 'fab',
      'charCode': 'f173'
    },
    {
      'v4Name': 'tumblr-square',
      'v5Name': 'tumblr-square',
      'prefix': 'fab',
      'charCode': 'f174'
    },
    {
      'v4Name': 'turkish-lira',
      'v5Name': 'lira-sign',
      'prefix': 'fas',
      'charCode': 'f195'
    },
    {
      'v4Name': 'twitch',
      'v5Name': 'twitch',
      'prefix': 'fab',
      'charCode': 'f1e8'
    },
    {
      'v4Name': 'twitter',
      'v5Name': 'twitter',
      'prefix': 'fab',
      'charCode': 'f099'
    },
    {
      'v4Name': 'twitter-square',
      'v5Name': 'twitter-square',
      'prefix': 'fab',
      'charCode': 'f081'
    },
    {
      'v4Name': 'unsorted',
      'v5Name': 'sort',
      'prefix': 'fas',
      'charCode': 'f0dc'
    },
    {
      'v4Name': 'usb',
      'v5Name': 'usb',
      'prefix': 'fab',
      'charCode': 'f287'
    },
    {
      'v4Name': 'usd',
      'v5Name': 'dollar-sign',
      'prefix': 'fas',
      'charCode': 'f155'
    },
    {
      'v4Name': 'user-circle-o',
      'v5Name': 'user-circle',
      'prefix': 'far',
      'charCode': 'f2bd'
    },
    {
      'v4Name': 'user-o',
      'v5Name': 'user',
      'prefix': 'far',
      'charCode': 'f007'
    },
    {
      'v4Name': 'vcard',
      'v5Name': 'address-card',
      'prefix': 'fas',
      'charCode': 'f2bb'
    },
    {
      'v4Name': 'vcard-o',
      'v5Name': 'address-card',
      'prefix': 'far',
      'charCode': 'f2bb'
    },
    {
      'v4Name': 'viacoin',
      'v5Name': 'viacoin',
      'prefix': 'fab',
      'charCode': 'f237'
    },
    {
      'v4Name': 'viadeo',
      'v5Name': 'viadeo',
      'prefix': 'fab',
      'charCode': 'f2a9'
    },
    {
      'v4Name': 'viadeo-square',
      'v5Name': 'viadeo-square',
      'prefix': 'fab',
      'charCode': 'f2aa'
    },
    {
      'v4Name': 'video-camera',
      'v5Name': 'video',
      'prefix': 'fas',
      'charCode': 'f03d'
    },
    {
      'v4Name': 'vimeo',
      'v5Name': 'vimeo-v',
      'prefix': 'fab',
      'charCode': 'f27d'
    },
    {
      'v4Name': 'vimeo-square',
      'v5Name': 'vimeo-square',
      'prefix': 'fab',
      'charCode': 'f194'
    },
    {
      'v4Name': 'vine',
      'v5Name': 'vine',
      'prefix': 'fab',
      'charCode': 'f1ca'
    },
    {
      'v4Name': 'vk',
      'v5Name': 'vk',
      'prefix': 'fab',
      'charCode': 'f189'
    },
    {
      'v4Name': 'volume-control-phone',
      'v5Name': 'phone-volume',
      'prefix': 'fas',
      'charCode': 'f2a0'
    },
    {
      'v4Name': 'warning',
      'v5Name': 'exclamation-triangle',
      'prefix': 'fas',
      'charCode': 'f071'
    },
    {
      'v4Name': 'wechat',
      'v5Name': 'weixin',
      'prefix': 'fab',
      'charCode': 'f1d7'
    },
    {
      'v4Name': 'weibo',
      'v5Name': 'weibo',
      'prefix': 'fab',
      'charCode': 'f18a'
    },
    {
      'v4Name': 'weixin',
      'v5Name': 'weixin',
      'prefix': 'fab',
      'charCode': 'f1d7'
    },
    {
      'v4Name': 'whatsapp',
      'v5Name': 'whatsapp',
      'prefix': 'fab',
      'charCode': 'f232'
    },
    {
      'v4Name': 'wheelchair-alt',
      'v5Name': 'accessible-icon',
      'prefix': 'fab',
      'charCode': 'f368'
    },
    {
      'v4Name': 'wikipedia-w',
      'v5Name': 'wikipedia-w',
      'prefix': 'fab',
      'charCode': 'f266'
    },
    {
      'v4Name': 'window-close-o',
      'v5Name': 'window-close',
      'prefix': 'far',
      'charCode': 'f410'
    },
    {
      'v4Name': 'window-maximize',
      'v5Name': 'window-maximize',
      'prefix': 'far',
      'charCode': 'f2d0'
    },
    {
      'v4Name': 'window-restore',
      'v5Name': 'window-restore',
      'prefix': 'far',
      'charCode': 'f2d2'
    },
    {
      'v4Name': 'windows',
      'v5Name': 'windows',
      'prefix': 'fab',
      'charCode': 'f17a'
    },
    {
      'v4Name': 'won',
      'v5Name': 'won-sign',
      'prefix': 'fas',
      'charCode': 'f159'
    },
    {
      'v4Name': 'wordpress',
      'v5Name': 'wordpress',
      'prefix': 'fab',
      'charCode': 'f19a'
    },
    {
      'v4Name': 'wpbeginner',
      'v5Name': 'wpbeginner',
      'prefix': 'fab',
      'charCode': 'f297'
    },
    {
      'v4Name': 'wpexplorer',
      'v5Name': 'wpexplorer',
      'prefix': 'fab',
      'charCode': 'f2de'
    },
    {
      'v4Name': 'wpforms',
      'v5Name': 'wpforms',
      'prefix': 'fab',
      'charCode': 'f298'
    },
    {
      'v4Name': 'xing',
      'v5Name': 'xing',
      'prefix': 'fab',
      'charCode': 'f168'
    },
    {
      'v4Name': 'xing-square',
      'v5Name': 'xing-square',
      'prefix': 'fab',
      'charCode': 'f169'
    },
    {
      'v4Name': 'y-combinator',
      'v5Name': 'y-combinator',
      'prefix': 'fab',
      'charCode': 'f23b'
    },
    {
      'v4Name': 'y-combinator-square',
      'v5Name': 'hacker-news',
      'prefix': 'fab',
      'charCode': 'f1d4'
    },
    {
      'v4Name': 'yahoo',
      'v5Name': 'yahoo',
      'prefix': 'fab',
      'charCode': 'f19e'
    },
    {
      'v4Name': 'yc',
      'v5Name': 'y-combinator',
      'prefix': 'fab',
      'charCode': 'f23b'
    },
    {
      'v4Name': 'yc-square',
      'v5Name': 'hacker-news',
      'prefix': 'fab',
      'charCode': 'f1d4'
    },
    {
      'v4Name': 'yelp',
      'v5Name': 'yelp',
      'prefix': 'fab',
      'charCode': 'f1e9'
    },
    {
      'v4Name': 'yen',
      'v5Name': 'yen-sign',
      'prefix': 'fas',
      'charCode': 'f157'
    },
    {
      'v4Name': 'yoast',
      'v5Name': 'yoast',
      'prefix': 'fab',
      'charCode': 'f2b1'
    },
    {
      'v4Name': 'youtube',
      'v5Name': 'youtube',
      'prefix': 'fab',
      'charCode': 'f167'
    },
    {
      'v4Name': 'youtube-play',
      'v5Name': 'youtube',
      'prefix': 'fab',
      'charCode': 'f167'
    },
    {
      'v4Name': 'youtube-square',
      'v5Name': 'youtube-square',
      'prefix': 'fab',
      'charCode': 'f431'
    },
    {
      'v4Name': ''
    }
  ]
};

function replaceIcon(skyIconHtml) {
  const nameMatches = skyIconHtml.match(/name\s*=\s*"([a-zA-Z0-9-]+?)"/);

  if (nameMatches && nameMatches.length > 0) {
    const oldIconName = nameMatches[1];
    const newIcon = map.icons.find((item) => item.v4Name === oldIconName);

    if (newIcon) {
      skyIconHtml = skyIconHtml.replace(oldIconName, `${newIcon.prefix} fa-${newIcon.v5Name}`);
    }
  }

  return skyIconHtml;
}

async function migrateIcons() {
  const results = await findInFiles.find(
    {
      term: 'sky-icon',
      flags: 'g'
    },
    'src',
    '\\.html'
  );

  for (const fileName of Object.keys(results)) {
    let fileContents = await fs.readFile(fileName, 'utf8');

    const matches = fileContents.match(/<sky-icon[\s\S]+?name\s*=\s*"([a-zA-Z0-9-]+?)"[\s\S]*?>/g);

    if (matches) {
      logger.info(`Updating icons in ${fileName}...`);
      matches.forEach((match) => {
        fileContents = fileContents.replace(match, replaceIcon(match));
      });

      await fs.writeFile(fileName, fileContents);
    }
  }
}

module.exports = {
  migrateIcons
};
