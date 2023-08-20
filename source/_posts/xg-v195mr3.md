---
title: Sophos Firewall v19.5 MR-3
date: 2023-08-20T09:00:00+09:00
tags:
  - XG Firewall
categories:
  - Security
---
{% asset_img title.png alt %}

## Sophos Firewall v19.5 MR3

Sophos Firewall v19.5 MR3が2023年8月2日に発表されました。
<!-- more -->

## 主なエンハンスの内容

MR3では65以上のパフォーマンスおよび安定化・セキュリティ向上に対応しています。また、今後、リモートアクセス製品であるZTNAのセキュアアクセスに対応させる予定とのこと。
私の所感としては、これまでのSophos FirewallのVPNではそれなりに便利に活用していますが、ZTNAで透過的にリモートアプリケーションが利用できるようになるとの事であれば期待が持てます。但し、ZTNAの導入にはSophos Centralが必要であること（無料）、ZTNAの価格についてホームユーザーの扱いがどうなるかはまだ判明しないように見えます。
システム構成としてはActive Directoryとの統合連携など法人向けには必須の要件が含まれているので、ホームユーザーからは少し遠い存在になってしまうかもしれません。


v19.5 MR3の詳細な説明はRelease Notesを参照してください。
> <https://docs.sophos.com/releasenotes/index.html?productGroupID=nsg&productID=xg&versionID=19.5>

Ipsec-VPNでSSL/TLSインスペクションが動作しないという不具合の改善も含まれています。

## Sophos Firewallのアップデート

XGの管理画面にログイン後、左ペインメニューの{% label primary @バックアップ＆ファームウェア %}の{% label primary @ファームウェアの確認 %}に通知が来る場合があります(以下はMR-2の画面です)。

{% asset_img notice.png 480 alt %}

また、アップデートの案内が来ていなくても、MySophosにログインし、バージョンアップの差分モジュールをダウンロードします。

1. Sophosのサイトの上部の「ソフォスについて」のプルダウンメニューから、{% label primary @ライセンスとアカウント %}をクリックします。
 > <https://www.sophos.com/ja-jp.aspx>
1. Sophos IDをお持ちでなければIDを作成します。
2. ログイン後、{% label primary @Network Protection %}をクリックします。
3. {% label primary @Firmware Updates %}をクリックします。
4. 「製品名/OSを使った検索」で”Firewall”を選択し、その後現れるプルダウンは"Software"を選択します。
5. {% label primary @Show Available Downloads %}ボタンをクリックします。

{% asset_img mysophos.png 800 alt %}

1. 上記画面で"SW-19.5.3_MR-3.SFW-652.sig"というアップデータが表示されますのでダウンロードします。
2. MY Sophosはここで終了してXGの管理画面にログインし、左ペインメニューの{% label primary @バックアップ＆ファームウェア %}の{% label primary @ファームウェアのタブメニュー %}から以下の画面に赤丸で囲った矢印のアイコンをクリックし、ダウンロードしたモジュールをアップロードします。

{% asset_img verup.png 800 alt %}

アップロード＆再起動ボタンをクリックし、v19.5 MR3へのアップグレードを完了させます。

{% asset_img upgrade.png 800 alt %}

{% note info %}
仮想環境（ESXi）上にFirewallをインストールされている方はアップグレードの前に、「{% post_link esxi-backup %}」を参考に、バックアップを確保される事をお勧めします。
{% endnote %}