---
title: XG Firewall v18のSSLインスペクションの動作確認と調整
date: 2020-03-21 08:57:45
tags:
  - XG Firewall
categories:
  - Security
---

{% note primary no-icon %}

## SSL/TLSインスペクションの動作確認

{% endnote %}

　さて、前回まで長かった設定も終わったのでIPS（Intrusion Prevension System）によるSSLインスペクションでの動作確認をしていきましょう。最初はテストマルウェアの検知についてです。有名どころでは、[eicar](https://www.eicar.org/)のテストマルウェアが挙げられます。早速、ダウンロードページにまいりましょう。
<!-- more -->
　[eicarのダウンロードページ](https://2016.eicar.org/85-0-Download.html)に行くと、「IMPORTANT NOTE」とhttp、httpsの以下それぞれの種類の合計8つのダウンロードリンクがあります。

{% asset_img eicar.png alt %}

1. 実行ファイル
2. 実行ファイルをtxtに拡張子を変えたもの
3. zipに圧縮したもの
4. zipの二重圧縮

　実行ファイルについては、マルウェアを検知する前にXGのポリシーによっては、実行ファイルをダウンロード出来ないという表示になる可能性があります。その際はWebのポリシーで修正するか、ルールとポリシーを修正し実行ファイルを一時的に許可し、確認してみて下さい。

　結論から言えば、XGはこの8つを全て検出し、ブラウザにはXGによるマルウェア検知のエラー画面が表示されます。PCに入っているウィルス対策ソフトが検知する以前にダウンロードは行わない挙動となります。また、XGの証明書を導入していない機器からのアクセスについてはhttpのものは検出できますが、httpsのダウンロードはマルウェアを検出できません。

　IPSは速度と検出能力という相反する事を同時に成り立たせなくてはいけません。上記のようにマルウェアの検出は可能ですが、あくまで通信で怪しいものをカットする程度に考え、クライアントにはウィルス対策ソフトやマルウェア対策ソフトの導入をお勧めします。Sophosは個人向けに無償のウィルス対策ソフトを提供していますが、個人的には異なる会社のソフトを組み合わせて使う事をお勧めします。

{% note primary no-icon %}

## SSL/TLSインスペクションの除外設定

{% endnote %}

　SSLインスペクションでは、本来正しいサイトにも関わらず、ポリシーが厳しすぎる事以外にもうまく接続できないという問題も発生します。

1. TLSが正当ではないと判断される
2. XGの署名がアプリケーションに認められない

　上記1については、XGの画面右上にログビューアというものがあるのでビューアからSSL/TLSインスペクションを選択します。私の環境では、norton.comが該当しています。TLSでエラーログが出力されていて、当該ドメインが安全と判断をするなら、以下の例外処置が行えます。Web→URLグループの{% label info@Local TLS Exclusion List %}にドメインを追加する事でSSLインスペクションが行われません。以下の通り、SSLインスペクションルール画面では、デフォルトの除外項目に{% label info@Local TLS Exclusion List %}が含まれています。
{% asset_img inspection-rule.png alt %}
{% asset_img inspection-rule1.png alt %}

　もう1つは対応が少し難しいのですが、アプリケーション自体が、OSにインストールされた証明書などを認めていないケースです。こちらはアプリケーションの内部に証明書を保持しており、その証明書の正当性を確認しているケースです。以下の例ではpython関連のモジュールをアップグレードするケースで以下のエラーが発生します。

```bash
>pip3 install --upgrade pip

WARNING: Retrying (Retry(total=4, connect=None, read=None, redirect=None, status=None))
after connection broken by 'SSLError(SSLCertVerificationError(1,  
'[SSL: CERTIFICATE_VERIFY_FAILED] certificate verify failed: unable to get local issuer certificate (_ssl.c:1076)'))': /simple/pip/
```

　上記のように、この場合は当該ドメインのSSLインスペクションを外す事になりますが、どのドメインかが分からないという難しさがあります。この場合は色々調べなくてはなりません。あくまで一例ですが除外しておいた方が良いドメインを列挙してみます。

| ドメイン                           | 内容                 |
| ---------------------------------- | -------------------- |
| pypi.org, pythonhosted.org         | Python関連           |
| npmjs.org                          | Node.js関連          |
| auone.jp, paypay.ne.jp, merpay.com | 〜pay関連            |
| norton.com                         | Norton AntiVirus関連 |
| d.line-scdn.net                    | LINE動画             |