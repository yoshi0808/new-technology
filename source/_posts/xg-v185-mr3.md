---
title: Sophos Firewall v18.5 MR-3
date: 2022-03-25 20:11:40
tags:
  - XG Firewall
categories:
  - Security
---
{% asset_img title.png alt %}

## Sophos Firewall v18.5 MR-3

Sophos Firewall v18.5 MR3が2022年3月24日に発表されました。主としては不具合の解消がメインです。また、v18.5を含みSophos Firewallの脆弱性の情報が提供されています。
<!-- more -->

## 主なエンハンスの内容

- OpenSSL(CVE-2022-0778)のサービス拒否の脆弱性を修正
- いくつかの重要なセキュリティ、パフォーマンス、信頼性の向上
- Sophosアンチスパムインターフェースに更新された電子メール保護アンチスパムエンジン

v18.5 MR-3の詳細な説明はSophos Communityを参照してください。出来るだけ早く適用するように推奨されています。
> <https://community.sophos.com/sophos-xg-firewall/b/blog/posts/sophos-firewall-v18-5-mr3-is-now-available>

## Sophos Firewallのアップデート

XGの管理画面にログイン後、左ペインメニューの{% label primary @バックアップ＆ファームウェア %}の{% label primary @ファームウェアの確認 %}ではただちに全てのユーザーにアップデートの案内が来るわけでは無いようなので、アップデートにはMySophosにログインし、バージョンアップの差分モジュールをダウンロードします。

1. Sophosのサイトの右上のプルダウンメニューから、{% label primary @ライセンスとアカウント %}をクリックします。
 > https://www.sophos.com/ja-jp.aspx
2. Sophos IDをお持ちでなければIDを作成します。
3. ログイン後、{% label primary @Network Protection %}をクリックします。
4. {% label primary @ファームウェアの更新 %}をクリックします。
5. 「製品名/OSを使った検索」で”ファイアーウォール”を選択し、その後現れるプルダウンは"ソフトウェア"を選択します。
6. {% label primary @選択可能なダウンロードを表示 %}ボタンをクリックします。

{% asset_img mysophos.png 800 alt %}

7. 上記画面で"SW-18.5.3_MR3-SFW-408"というアップデータが表示されますのでダウンロードします。
8. MY Sophosはここで終了してXGの管理画面にログインし、左ペインメニューの{% label primary @バックアップ＆ファームウェア %}の{% label primary @ファームウェアのタブメニュー %}から以下の画面に赤丸で囲った矢印のアイコンをクリックし、ダウンロードしたモジュールをアップロードします。

{% asset_img verup.png 800 alt %}

アップロード＆再起動ボタンをクリックし、MR3へのアップグレードを完了させます。

{% asset_img upgrade.png 800 alt %}

{% note info %}
仮想環境（ESXi）上にFirewallをインストールされている方はアップグレードの前に、「{% post_link esxi-backup %}」を参考に、バックアップを確保される事をお勧めします。
{% endnote %}

## Sophos FirewallのCVE-2022-1040

Sophosからは、Resolved RCE in Sophos Firewallという記事で2022-03-25に発表されています。これは、リモートコード実行を可能にする認証バイパスの脆弱性であり、SophosファイアウォールのユーザーポータルとWebadminで影響を受けます。

> Sophos Resolved RCE in Sophos Firewall (CVE-2022-1040)
 <https://www.sophos.com/en-us/security-advisories/sophos-sa-20220325-sfos-rce>

ただし、このブログで掲載している過去記事、「{% post_link protect-xg %}」で記載の通り、ローカルサービスACLにてWANからのWebadminおよびユーザーポータルからのアクセスが行えない状況にしてあれば、まず安全と言えます。Sophosではこういった脆弱性対策のためにHotFix機能を持っていて、速やかにパッチが自動更新されます。
{% asset_img acl.png 800 alt %}
※SSL-VPNを利用されている方はWANの項目にチェックが入る事は問題ありません。

{% asset_img hotfix.png 640 alt %}

### HotFixの確認

Firewall本体のコマンドコンソールにアクセスします。XG本体のコンソールまたは、ESXi上にインストールされている方はESXiのコンソールからFirewallのAdminのパスワードを入力し、ログインします。コマンドコンソールからは、{% label primary @5.Device Management %}を選択、さらに、{% label primary @3.Advanced Shell %}を選択します。そして以下のコマンドを実行します。

```
SFVH_SO01_SFOS 18.5.3 MR-3-Build408#SFVUNL_SO01_SFOS 18.5.2 MR-2-Build380# test -f /static/up_mode_json_stamp && echo "Hotfix is applied" || echo "Hotfix isn't applied"
Hotfix is applied
```

上記のように"Hotfix is applied"と表示されればHotFixは適用済みです。isn't appliedとでた場合はしばらく待つかSophosへのインターネットの接続性の確認が必要です。

