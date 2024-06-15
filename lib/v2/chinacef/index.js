const utils = require('./utils');
const cheerio = require('cheerio');
// const got = require('@/utils/got');
const puppeteer = require('@/utils/puppeteer');

module.exports = async (ctx) => {
    const rssTitle = '最新更新 - 首席经济学家论坛';
    // const regex = /^\/index\.php\/index\/article\/article_id\/\d+/g;
    const regex = /^(?!https?:\/\/).+/g;

    const link = `http://www.chinacef.cn`;

    // const response = await got.get('http://www.chinacef.cn/index.php/index/index');
    // const $ = cheerio.load(response.data);

    const browser = await puppeteer();
    const page = await browser.newPage();
    await page.goto(link, {
        // 指定页面等待载入的时间
        waitUntil: 'domcontentloaded',
    });
    // 获取页面的 HTML 内容
    const response = await page.content();
    // 关闭标签页
    page.close();

    const $ = cheerio.load(response);

    browser.close();

    const articlesLinkListNode = $('a[target=_blank]')
        .filter((_, item) => item.attribs.href.match(regex))
        .map((_, item) => item.attribs.href);
    const articlesLinkList = Array.from(new Set(articlesLinkListNode));

    const articles = await Promise.all(
        articlesLinkList.map(async (item) => {
            const articlesLink = utils.siteLink + item;

            const detail = await ctx.cache.tryGet(articlesLink, () => utils.getArticleDetail(articlesLink));

            const element = {
                title: detail.title,
                author: detail.author,
                pubDate: detail.time,
                description: detail.description,
                link: articlesLink,
            };
            return element;
        })
    );

    ctx.state.data = {
        title: rssTitle,
        link: utils.siteLink,
        item: articles,
    };
};
