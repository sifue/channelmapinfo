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
      createNumMembersDiff().then((channels) => {
        robot.logger.info(channels);
      }).catch(console.error);
  });

  /**
   * 前日と今日のチャンネル人数のDiffを作成する
   * @return Promise.<Object[]>
   */
  function createNumMembersDiff() {
    return loadYesterdayChannelList().then((yesterdayChannels) => {
      const yesterdayMap = new Map();
      yesterdayChannels.forEach((c) => {
        yesterdayMap.set(c.id, c);
      });

      return fetchChannelList().then((todayChannels) => {
        // Diff配列を作る
        const diffs = [];
        todayChannels.forEach((c) => {
          if (yesterdayMap.has(c.id)) {
            const yesterdayChannel = yesterdayMap.get(c.id);
            // チャンネル人数に差があるチャンネルを属性足して追加
            if(c.num_members !== yesterdayChannel.num_members) {
              c.diff_num_members = c.num_members - yesterdayChannel.num_members;
              diffs.push(c);
            }
          }
        });
        return diffs;
      });
    });
  }

  /**
   * 前日のログファイルをローカルファイルをより取得する
   * @return Promise.<Object[]>
   */
  function loadYesterdayChannelList() {
    const yesterday = new Date(new Date().getTime() - (1000 * 60 * 60 * 24));
    const filename = CHANNELS_LOG + '/' + moment(yesterday).format('YYYY-MM-DD') + '.json';
    return new Promise((resolve, reject) => {
      fs.readFile(filename, 'utf-8', (err, data) => {
        if (err) {
          reject(err);
          return;
        } 
        return resolve(JSON.parse(data));
      });
    });
  }

  /**
   * チャンネル一覧をSlackより取得し、その日のファイルとして上書き保存する
   * @return Promise.<Object[]>
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