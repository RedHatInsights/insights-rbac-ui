import Sitemap from 'react-router-sitemap';
import packageJson from '../package.json';
import fs from 'fs';

const paths = Object.values(packageJson.routes).map(value => value.path || value);

const hostname = 'https://cloud.redhat.com';

const sitemap = Sitemap.sitemapBuilder(hostname, paths);
fs.writeFileSync('./sitemap.xml', sitemap.toString());

