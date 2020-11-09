---
title: XG Firewall v18 MR3の更新
date: 2020-10-25T15:31:42+09:00
tags:
  - XG Firewall
categories:
  - Security
---
{% asset_img XG.png alt %}

## XG Firewall v18 MR-3

XG Firewall v18のMR-3が2020年10月12日に発表されました。マイナーアップデートですが、変更点について記載します。

<!-- more -->

## 主なエンハンスの内容

- セキュリティ強化
機密情報の暗号化が行われました。これに伴い、新たにセキュア・ストレージ・マスターキーというものを作成する必要があります。また次回のアップデートでも暗号化される項目は追加されるとの事です。
- SSL VPNの強化。トラフィック転送量が増加し、WindowsクライアントにSSL VPNが対応しました。
- その他の不具合の修正

私はMR-3の発表された日に早速バージョンアップし、本日まで約10日ほど経過しましたが、特段何かの変化は感じず安定して利用できています。
v18 MR-3の詳細な説明はSophos Communityの[こちらの記事](https://community.sophos.com/xg-firewall/b/blog/posts/xg-firewall-v18-mr3)を参照してください。

### XGのアップデート

XGのv17からのアップデートは、 v17.5 MR13/ MR14/ MR14-1が対象となっています。XGのv18であればMR-3へのアップデートは可能です。
XGの管理画面にログイン後、左ペインメニューの{% label primary @バックアップ＆ファームウェア %}の{% label primary @ファームウェアの確認 %}ではただちに全てのユーザーにアップデートの案内が来るわけでは無いようなので、アップデートにはMySophosにログインし、バージョンアップの差分モジュールをダウンロードします。

1. [Sophosのサイト](https://www.sophos.com/ja-jp.aspx)の右上のメニューから、{% label primary @マイアカウント %}をクリックします。
2. Sophos IDをお持ちでなければIDを作成します。
3. ログイン後、{% label primary @My Sophos %}のリンクをクリックし、さらに画面左側の{% label primary @Network Protection %}をクリックします。
4. {% label primary @ファームウェアの更新 %}をクリックします。
5. 「製品名/OSを使った検索」で”ファイアーウォール”を選択し、その後現れるプルダウンは"ソフトウェア"を選択します。
6. {% label primary @選択可能なダウンロードを表示 %}ボタンをクリックします。

{% asset_img mysophos.png alt %}

7. 上記画面で"SW-18.0.3_MR-3.SFW-457.sig"というアップデータが表示されますのでダウンロードします。
8. MY Sophosはここで終了し、XGの管理画面にログインし、左ペインメニューの{% label primary @バックアップ＆ファームウェア %}の{% label primary @ファームウェアのタブメニュー %}から、以下の画面に赤丸で囲った矢印のアイコンをクリックし、ダウンロードしたモジュールをアップロードします。

{% asset_img verup.png alt %}

アップロード＆再起動ボタンをクリックし、MR-3へのアップグレードを完了させます。

{% note info no-icon %}
仮想環境（ESXi）上にXGをインストールされている方はアップグレードの前に、「{% post_link esxi-backup %}」を参考に、XGのバックアップを確保される事をお勧めします。
{% endnote %}

## セキュア・ストレージ・マスターキー

XGが再起動し、ログイン後、新たに追加されたセキュア・ストレージ・マスターキーの作成を求められます。

{% asset_img key1.png alt %}

以下の通り、最低12文字で、大文字・小文字・記号を含める必要があります。
{% asset_img key2.png alt %}

登録を終えると、マスターキーがセットされたとのメッセージが表示されて対応は完了です。
{% asset_img key3.png alt %}

マスターキーの情報は「{% post_link bitwarden %}」を参考に、暗号化された安全な場所へ保管されることをお勧めします。
