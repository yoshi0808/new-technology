---
title: XG Firewall v18のSSLインスペクションの動作確認と調整
date: 2020-03-21 08:57:45
tags:
  - XG Firewall
categories:
  - Security
---
<p class="onepoint">この記事で実現すること</p>
XG FirewallのSSL/TLSインスペクションが有効に機能している事をテストマルウェアを使い検証します。また、SSL/TLSインスペクションによって接続出来なくなる場合は除外設定を行います。
<!-- more -->

## SSL/TLSインスペクションの動作確認

前回までの記事でXGのSSL/TLSインスペクションの設定が完了している事を前提にしています。SSL/TLSインスペクションに関する記事は以下を参照してください。

- {% post_link ssl-inspection %}
- {% post_link ssl-inspection1 %}

IPS（Intrusion Prevension System）によるSSLインスペクションでの動作確認のため、テストマルウェアの検知について行います。有名どころでは、eicarのテストマルウェアが挙げられます。早速、ダウンロードページにまいりましょう。**eicarのダウンロードページ**に行くと、{% label primary @Download area using the secure, SSL enabled protocol HTTPS %}という項目があり、httpsの4つのダウンロードリンクがあります。

> eicar
 <https://www.eicar.org/?page_id=3950>

- 実行ファイル
- 実行ファイルをtxtに拡張子を変えたもの
- zipに圧縮したもの
- zipの二重圧縮

実行ファイルについては、マルウェアを検知する前にXGのポリシーによって、実行ファイルをダウンロードできないという表示になる可能性があります。その際はWebのポリシーで修正するか、ルールとポリシーを修正し実行ファイルを一時的に許可し、確認してみて下さい。前回までの記事で記載してきた通り、SSL/TLSインスペクションが行えるクライアントと行えないクライアントで挙動は変わります。

SSL/TLSインスペクションが行えるクライアントは、この4つを全て検出し、ブラウザにはXGによるマルウェア検知のエラー画面が表示されます。PCに入っているウィルス対策ソフトが検知する以前にダウンロードは行わない挙動となります。また、SSLインスペクション対象外のクライアントからのアクセスについてはhttpsのダウンロードはマルウェアを検出できず、ダウンロードしてしまいます。

IPSは速度と検出能力という相反する事を同時に成り立たせなくてはいけません。上記のようにマルウェアの検出は可能ですが、あくまで通信で怪しいものをカットする程度に考え、クライアントにはウィルス対策ソフト（Windows Defenderを含む）やマルウェア対策ソフトの導入をお勧めします。Sophosはホームユーザー向けに無償のウィルス対策ソフトを提供していますが、個人的には異なる会社のソフトを組み合わせて使う事をお勧めします。

## SSL/TLSインスペクションの除外

XGは、Webフィルターやアプリケーションフィルターなどのポリシーで接続の可否を判断しますが、実はSSL/TLSインスペクションが理由で接続できないという問題も発生します。これは以下の通りです。

1. TLSが正当ではないと判断される
2. XGの証明書がアプリケーションに認められない

接続できない理由は後述しますが、XGは、XG自身で最初からSSL/TLSインスペクションの対象外とするドメインリストを既に保持しています。そのリストになく、自身で利用するサイトやアプリケーションがSSL/TLSインスペクションによって動作しない場合は個別に当該ドメインをSSL/TLSインスペクションの対象外と指定します。

XGで最初からSSL/TLSインスペクションの対象外となっているリストは、XGの左ペインメニュー{% label primary@web %}の”URLグループ"に{% label primary@Managed TLS exclusion list %}があり、ここに複数の有名なWebサイトのドメインが列挙されています。
{% asset_img exclusion.png alt %}

{% note warning %}

このリストは編集できません。ファームウェアの更新によって管理されます。

{% endnote %}

### 除外設定

除外リスト{% label primary@Managed TLS exclusion list %}にドメインが列挙されておらず、またポリシー上は利用できるはずのWebサイトに接続できない場合、XGの画面右上のログビューアからSSL/TLSインスペクションを選択しSSL/TLSインスペクションでエラーが発生していないか確認を行います。Web→URLグループの{% label primary@Local TLS Exclusion List %}という個別にカスタマイズ可能なリストがあるので、そのリストにドメインを追加する事でSSL/TLSインスペクションの対象外とできます。以下の通り、SSL/TLSインスペクションルール画面では、デフォルトの除外リストに{% label primary@Managed TLS exclusion list %}および{% label primary@Local TLS Exclusion List %}が存在します。{% label primary@Local TLS Exclusion List %}の初期状態は何も登録されていません。

{% asset_img inspection-rule3.png alt %}
{% asset_img inspection-rule4.png alt %}

### SSL/TLSインスペクションによって接続できない理由

SSL/TLSインスペクションで接続できない理由の1つ目は、SSL/TLS証明書の正当性を厳しくチェックしすぎる場合が該当します。過渡期ではありますが、まだまだ古いバージョンのTLSが利用されていサイトもあります。これを緩める場合は、XGの左ペインメニュー{% label primary@ルールとポリシー %}の"SSL/TLSインスペクションルール"画面で、SSL/TLSインスペクションを行っているプロファイルのルールを緩めるか、"SSL/TLSインスペクションの設定"をカスタマイズします。
{% asset_img inspection-rule2.png alt %}

もう1つの接続できない理由は、アプリケーション自体が、OSにインストールされた証明書などを認めていないケースです。こちらはアプリケーションの内部に証明書を保持しており、その証明書の正当性を確認しているケースです。以下の例ではpython関連のモジュールをアップグレードするケースで以下のエラーが発生します。

```bash
>pip3 install --upgrade pip

WARNING: Retrying (Retry(total=4, connect=None, read=None, redirect=None, status=None))
after connection broken by 'SSLError(SSLCertVerificationError(1,
'[SSL: CERTIFICATE_VERIFY_FAILED] certificate verify failed: unable to get local issuer certificate (_ssl.c:1076)'))': /simple/pip/
```

XGの画面右上にある"ログビューア"から"SSL/TLSインスペクション"を選択し、どのURLのSSL/TLSインスペクションが行われているのかを確認できます。また、エラーがある場合は、そこで除外を指定する事で自動的に{% label primary@Local TLS Exclusion List %}にドメインが追加されます。下記はあくまで一例ですが除外しておいた方が良いドメインを列挙します。追加した証明書を参照しないプロダクトはアプリケーションの挙動とこのログを見ながら手作業で{% label primary@Local TLS Exclusion List %}に除外するドメインを追加する作業を行います。

| ドメイン                           | 内容                 |
| ---------------------------------- | -------------------- |
| pypi.org, pythonhosted.org         | Python関連           |
| npmjs.org                          | Node.js関連          |
| github.com                         | GitHub               |
| ubuntu.com,snapcraft.io            | ubuntu関連           |
| livepatch.canonical.com            | ubuntu関連           |
| auone.jp, paypay.ne.jp, merpay.com | 〜pay関連            |
| norton.com                         | Norton AntiVirus関連 |
| d.line-scdn.net                    | LINE動画             |
