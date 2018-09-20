'use strict';
const { WebClient } = require('@slack/client');
const fs = require('fs');

module.exports = (robot) => {
  // 定期実行
  const CronJob = require('cron').CronJob;
  const job = new CronJob('0 * * * * *', () => {
    robot.logger.info('きたよ');
    robot.send({ room: '#チャンネルマップ'}, 'きたよ');
  });
  job.start();

  // チャットリプライ
  robot.hear(/ch-map-info>/i, (msg) => {
      const username = msg.message.user.name;
      msg.send('Hello, ' + username);
      fetchChannelList().then((channels) => {
        robot.logger.info(channels);
      });
  });

  /**
   * チャンネル一覧を取得し、ファイルとして保存する
   */
  function fetchChannelList() {
    const token = process.env.HUBOT_SLACK_TOKEN;
    const web = new WebClient(token);

    return web.channels.list().then((res) => {
      return new Promise((resolve, reject) => {
        fs.writeFile('./channels.json', JSON.stringify(res.channels), (err) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(res.channels);
        });
      });
    });
  }
};