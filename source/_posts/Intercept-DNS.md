---
title: XG Firewall v18で正しいDNS利用を強制する
tags:
  - XG Firewall
categories:
  - Security
date: 2020-05-16 11:39:23
---
<p class="onepoint">この記事で実現すること</p>
ユーザーが指定したDNS（多くはプロバイダDNS）に反し、行儀の悪いクライアントや悪意のあるプログラムはそれに従わず、別のDNSを参照する可能性があります。XG Firewall v18の機能を活用してDNSの安全性を確保します。

<!-- more -->

## DNSとプライバシー

Sophos CommunityでもDNSの扱いについてはいろいろ議論されていますが、ベストプラクティスとしては**DNS Best Practices for XG**の記事にいくつかのアドバイスがあります。（※過去記事についてすでに削除されてしまいました）

{% cq %}

The best protection is to use XG as dns server, configure dns request routing and nothing else. Avoid to open udp port 53.
最良の防御策はXGをDNSサーバとして使用し、DNSリクエストのルーティングを設定すること。それ以外は何も行わないことです。udpポート53を開かないようにしてください。

{% endcq %}

この一言で既にDNSの使い方については答えが出てしまいましたが、記事が2017年とやや古い事もあり、v18の機能を生かしたDNSの設定例を書きます。

DNSとプライバシーは国によって扱いが変わるかも知れません。国が人々のネットのアクセス状況を把握している事が問題とされている場所では、パブリックDNSが好まれます。また海外ではプロバイダーがDNSを改ざんするといったニュースも見かけます。日本国内においては、プロバイダのDNSの応答速度が遅い事から利用されるケースが増えてきているようです。

ブラウザのFireFoxでは、プライバシー保護を目的として、DNSについてHTTPSを利用したDNS over HTTPSに対応しています。この機能は日本ではデフォルトでオフになっていますが、HTTPSで暗号化されているため管理者側からは一般的なネットブラウジングと区別がつかず、トラフィックが見えづらくなります。

私個人としてはDNSを含めたプライバシーの情報を無闇に拡散させない事が重要と考えています。また、Communityで言及されている通り、防御のためにDNSのPortは空けない事が重要と考えます。パブリックDNSの利用はユーザーそれぞれにとっては考え方は異なるかとおもいますので、これ以降は悪意をもったクライアントが本来のDNS設定を迂回する事の対策として読んでいただければとおもいます。

## XG v18で指定DNSを強制する

ここではDNS情報はDHCPで配布されている前提とします。このブログでは、クライアントが参照するDNSは、全てXGのDNSを指定するように設定しています。この前提で、これを回避しようとするクライアントに対して以下の対策を取ります。

- DNS over TLS(DoT)は拒否
 Port853の拒否
- DNS over HTTPS(DoH)は拒否
 RFC8484に基づき、MIMEヘッダーの"application/dns-message"を見つけて、その通信を拒否
- Public DNSへのアクセス（Port53）は、強制的にXGのDNS経由で本来のDNSにアクセス
 XGのDNATの機能を使い、WANインターフェースに対するPort53の通信だった場合、宛先IPをXGのLANのIPアドレスに変換

{% asset_img xg-dns.png alt %}

アプリケーションは、DoTやDoHを止められると（一般的には）通常のDNS(Port53)にフォールバックします。そしてXGは強制的にDNSの向き先を変えますが、クライアントはパブリックDNSにアクセスしたと思い込んだまま、返されたIPに対しアクセスする事になります。

### DoHの拒否

DoHの定義についてサービスの登録を行います。

XGの左ペインメニュー{% label primary@Web %}の{% label primary@ファイルタイプ %}から追加ボタンをクリックします。{% label primary@名前 %}は"DoH"、{% label primary@テンプレート %}を空白とし、{% label primary@MIMEヘッダー %}に`application/dns-message`と入力し、保存します。

{% asset_img mimetype.png alt %}

左ペインメニュー{% label primary@Web %}の{% label primary@ユーザーアクティビティ %}から"追加"ボタンをクリックし、DoHとして登録したカテゴリを加え、`DNS over HTTPS`と名前を付けて保存します。
{% asset_img mimetype2.png alt %}

続いて、具体的な拒否設定です。

左ペインメニュー{% label primary@Web %}の{% label primary@ポリシー %}からご自身がFirewallルールで利用しているポリシー（ここでは"Home Policy"を仮定しています）に、上記で登録してきた"DNS over HTTPS"を拒否する設定を加えます。

{% asset_img policy.png alt %}

### DoTの拒否

XGの左ペインメニュー{% label primary@ホストとサービス %}の{% label primary@サービス %}から、"追加"ボタンをクリックし、"送信元ポート"1〜65535、"宛先ポート"853を指定し、"DoT"と名前を付け保存します。

{% asset_img service.png alt %}

XGの左ペインメニュー{% label primary@ルールとポリシー %}から新しいファイアウォールルールを追加し、以下のようにDoTを"拒否"するルールを作成します。

{% asset_img rule1.png alt %}

### DNSに関するDNAT

最初にDNATで必要なホストの定義を行います。LANで使っているネットワークアドレスの登録とXG自身のIPアドレスの登録が必要です。ネットワークアドレスについてIPv4は例えば、`192.168.1.0/24`、IPv6は例えば`fd00:beef:cafe::/64`などの登録を行います。XG自身のIPアドレスも登録が必要です。

{% asset_img host.png alt %}

XGの左ペインメニュー{% label primary@ルールとポリシー %}から、{% label primary@NATルール %}を選択、"NATルールの追加"ボタンをクリックし、DNATを設定します。

1. "変換前の送信元"は、使っているネットワークのオブジェクトを登録します
2. "変換前のサービス"は、"DNS"を選択します
3. "返還後の宛先（DNAT）"は、XG自身のIPを指定します
4. "アウトバウンドインターフェース"には、WANである、"Port2"を選択します
5. 最後に追加ボタンをクリックして登録を完了します

{% asset_img rule2.png alt %}

上記はIPv4の例ですが、IPv6を利用されている方は、同様にIPv6のDNATも設定してください。

### 動作確認

上記DNATによるDNSのインターセプトが有効になると、{% label primary@ルールとポリシー %}の{% label primary@NATルール %}画面で実際に変換された数が確認できるので、これで挙動を確認してください。

{% asset_img rule3.png alt %}

以上がプライバシーと安全性を重視したv18ならではのDNSのベストプラクティスです。

## DNSに関しての補足

GoogleDNSのDoHはRFC8484に従っていない独自プロトコルを使えるという事実があります。世界中のパブリックDNSを全て把握するのは困難ですが、Sophosのコミュニティの記事を参考にWebフィルタのURLグループにパブリックDNSのドメインを登録し、拒否する設定を加えても良いでしょう。詳細は、以下の記事を参照してください。
> Sophos Community -DNS over HTTPS (DoH) for web security-
 <https://community.sophos.com/kb/en-us/134644>
