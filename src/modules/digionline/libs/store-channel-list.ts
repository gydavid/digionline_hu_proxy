import * as cheerio from 'cheerio';
import { propEq } from 'ramda';
const got = require('got');
import programUrls from '../../../config/program_urls.json';
import config from '../../../config/config.json';
import { Category, Channel } from '../../../interfaces';

export async function getChannelList() {
  const response = await got('https://digionline.hu/csatornak', {
    timeout: 1000 * 30,
    retry: 3,
  });
  const $ = cheerio.load(response.body);
  const categories = parseCategories($);
  return parseChannels(categories, $);
}

function parseCategories($: CheerioStatic): Category[] {
  return $('#categories option[value!="0"]')
    .toArray()
    .map((option) => ({
      id: $(option).val(),
      name: $(option).text(),
    }));
}

function parseChannels(categories: Category[], $: CheerioStatic): Channel[] {
  return $('.channel')
    .toArray()
    .map((channel) => {
      const $channel = $(channel);
      const id = $channel.find('.favorite').attr('data-id');
      const name = $channel.find('.channels__name').text().trim();
      return {
        name,
        logoUrl: $channel.find('img').attr('src'),
        id,
        category: categories.find(propEq('id', $(channel).attr('data-category'))),
        url: getChannelUrl(id),
        programUrl: getProgramUrl(id, name),
      };
    });
}

function getProgramUrl(id, name): string {
  return programUrls.find((program) => program.name === name || program.id === id).programUrl;
}

function getChannelUrl(id: string) {
  return config.web.auth.enabled
    ? `${config.web.ssl ? 'https' : 'http'}://${config.web.auth.user}:${config.web.auth.password}@${
        config.web.domain
      }:${config.web.outerPort}/channel/${id}`
    : `${config.web.ssl ? 'https' : 'http'}://${config.web.domain}:${config.web.outerPort}/channel/${id}`;
}
