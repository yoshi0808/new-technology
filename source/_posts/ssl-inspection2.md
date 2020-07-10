---
title: XG Firewall v18のSSLインスペクションの動作確認と調整
date: 2020-03-21 08:57:45
tags:
  - XG Firewall
categories:
  - Security
---

{% note success  %}

## この記事で実現すること

XG FirewallのSSLインスペクションが有効に機能している事をテストマルウェアを使い検証します。また、SSLインスペクションによってサイトによっては接続出来なくなる場合があり、これを除外する方法を確認します。

{% endnote %}
<!-- more -->

## SSLインスペクションの動作確認

前回までの記事でXGのSSLインスペクションの設定が完了している事を前提にしています。過去の記事は以下をご覧ください。

- {% post_link ssl-inspection %}
- {% post_link ssl-inspection1 %}

IPS（Intrusion Prevension System）によるSSLインスペクションでの動作確認のため、テストマルウェアの検知について行います。有名どころでは、[eicar](https://www.eicar.org/)のテストマルウェアが挙げられます。早速、ダウンロードページにまいりましょう。[eicarのダウンロードページ](https://2016.eicar.org/85-0-Download.html)に行くと、「IMPORTANT NOTE」とhttp、httpsの以下それぞれの種類の合計8つのダウンロードリンクがあります。

{% asset_img eicar1.png alt %}

1. 実行ファイル
2. 実行ファイルをtxtに拡張子を変えたもの
3. zipに圧縮したもの
4. zipの二重圧縮

実行ファイルについては、マルウェアを検知する前にXGのポリシーによって、実行ファイルをダウンロード出来ないという表示になる可能性があります。その際はWebのポリシーで修正するか、ルールとポリシーを修正し実行ファイルを一時的に許可し、確認してみて下さい。前回までの記事で記載してきた通り、SSLインスペクションが行えるクライアントと行えないクライアントで挙動は変わります。

SSLインスペクションが行えるクライアントは、この8つを全て検出し、ブラウザにはXGによるマルウェア検知のエラー画面が表示されます。PCに入っているウィルス対策ソフトが検知する以前にダウンロードは行わない挙動となります。また、SSLインスペクション対象外のクライアントからのアクセスについてはhttpのものは検出できますが、httpsのダウンロードはマルウェアを検出できません。

IPSは速度と検出能力という相反する事を同時に成り立たせなくてはいけません。上記のようにマルウェアの検出は可能ですが、あくまで通信で怪しいものをカットする程度に考え、クライアントにはウィルス対策ソフト（Windows Defenderを含む）やマルウェア対策ソフトの導入をお勧めします。Sophosはホームユーザー向けに無償のウィルス対策ソフトを提供していますが、個人的には異なる会社のソフトを組み合わせて使う事をお勧めします。

## SSLインスペクションの除外について

XGは、Webフィルターやアプリケーションフィルターなどのポリシーで接続の可否を判断しますが、実はSSLインスペクションが理由で接続できないという問題も発生します。これは以下の通りです。

1. TLSが正当ではないと判断される
2. XGの証明書がアプリケーションに認められない

接続できない理由は後述しますが、XGは、XG自身で最初からSSLインスペクションの対象外とするドメインリストを既に保持しています。そのリストになく、自身で利用するサイトやアプリケーションがSSLインスペクションによって動作しない場合は個別に当該ドメインをSSLインスペクションの対象外と指定します。

XGで最初からSSLインスペクションの対象外となっているリストは、XGの左ペインメニュー{% label @web %}の”URLグループ"に"Managed TLS exclusion list"があり、ここに複数の有名なWebサイトのドメインが列挙されています。
{% asset_img exclusion.png alt %}

このリストは編集できません。ファームウェアの更新によって管理されます。

## SSLインスペクションの除外設定

"Managed TLS exclusion list"にドメインが列挙されておらず、またポリシー上は利用できるはずのWebサイトに接続できない場合、XGの画面右上のログビューアからSSL/TLSインスペクションを選択しSSLインスペクションでエラーが発生していないか確認を行います。Web→URLグループの"Local TLS Exclusion List"という個別にカスタマイズ可能なリストがあるので、そのリストにドメインを追加する事でSSLインスペクションの対象外とする事ができます。以下の通り、SSLインスペクションルール画面では、デフォルトの除外項目に"Managed TLS exclusion list"および"Local TLS Exclusion List"が存在します。"Local TLS Exclusion List"の初期状態は何も登録されていません。

{% asset_img inspection-rule3.png alt %}
{% asset_img inspection-rule4.png alt %}

### SSLインスペクションによって接続できない理由

SSLインスペクションで接続できない理由の1つ目は、SSL/TLS証明書の正当性を厳しくチェックしすぎる場合が該当します。過渡期ではありますが、まだまだ古いバージョンのTLSが利用されていサイトもあります。これを緩める場合は、XGの左ペインメニュー{% label @ルールとポリシー %}の"SSL/TLSインスペクションルール"画面で、SSLインスペクションを行っているプロファイルのルールを緩めるか、"SSL/TLSインスペクションの設定"をカスタマイズします。
{% asset_img inspection-rule2.png alt %}

もう1つの接続できない理由は、アプリケーション自体が、OSにインストールされた証明書などを認めていないケースです。こちらはアプリケーションの内部に証明書を保持しており、その証明書の正当性を確認しているケースです。以下の例ではpython関連のモジュールをアップグレードするケースで以下のエラーが発生します。

```bash
>pip3 install --upgrade pip

WARNING: Retrying (Retry(total=4, connect=None, read=None, redirect=None, status=None))
after connection broken by 'SSLError(SSLCertVerificationError(1,  
'[SSL: CERTIFICATE_VERIFY_FAILED] certificate verify failed: unable to get local issuer certificate (_ssl.c:1076)'))': /simple/pip/
```

上記のように、この場合は当該ドメインのSSLインスペクションを外す事になりますが、XGの画面右上にある"ログビューア"から"SSL/TLSインスペクション"を選択し、どのURLのSSLインスペクションが行われているのかを確認できます。下記はあくまで一例ですが除外しておいた方が良いドメインを列挙します。これらは上述した"Local TLS Exclusion List"にサブドメインを登録する事になります。

| ドメイン                           | 内容                 |
| ---------------------------------- | -------------------- |
| pypi.org, pythonhosted.org         | Python関連           |
| npmjs.org                          | Node.js関連          |
| github.com                         | GitHub               |
| auone.jp, paypay.ne.jp, merpay.com | 〜pay関連            |
| norton.com                         | Norton AntiVirus関連 |
| d.line-scdn.net                    | LINE動画             |
