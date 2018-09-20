'use strict';
const moment = require('moment');
const { WebClient } = require('@slack/client');
const fs = require('fs');
const CHANNELS_LOG = 'channels_log';

// 保存フォルダ作成
fs.mkdir(CHANNELS_LOG,  (err) => {
  if(err && err.code !== 'EEXIST') { // すでにディレクトリ存在する以外のエラーの場合
    console.error(err);
  }
});


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
   * チャンネル一覧を取得し、その日のファイルとして上書き保存する
   */
  function fetchChannelList() {
    const filename = CHANNELS_LOG + '/' + moment().format('YYYY-MM-DD') + '.json';
    const token = process.env.HUBOT_SLACK_TOKEN;
    const web = new WebClient(token);

    return web.channels.list().then((res) => {
      return new Promise((resolve, reject) => {
        fs.writeFile(filename, JSON.stringify(res.channels), (err) => {
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