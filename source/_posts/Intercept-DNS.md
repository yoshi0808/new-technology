---
title: XG Firewall V18で正しいDNS利用を強制する
tags:
  - XG Firewall
categories:
  - Security
date: 2020-05-16 11:39:23
---


{% note success  %}

## この記事で実現する内容について

　自分で設定したDNS（多くはプロバイダDNS）に反し、行儀の悪いクライアントや悪意のあるプログラムはそれに従わず、全く別のDNSを参照する可能性があります。XG Firewall V18の機能を活用してDNSの安全性を確保します。


{% endnote %}

<!-- more -->

{% note primary no-icon %}

## DNSとプライバシー

{% endnote %}

　Sophos CommunityでもDNSの扱いについてはいろいろ議論されていますが、ベストプラクティスとしては[DNS Best Practices for XG](https://community.sophos.com/products/xg-firewall/f/network-and-routing/95100/dns-best-practices-for-xg)の記事にあります。

{% cq %}

最良の防御策はXGをDNSサーバとして使用し、DNSリクエストのルーティングを設定すること。それ以外は何も行わないことです。udpポート53を開かないようにしてください。
The best protection is to use XG as dns server, configure dns request routing and nothing else. Avoid to open udp port 53.

{% endcq %}

　この一言で既にDNSの使い方については答えが出てしまいましたが、記事が2017年とやや古い事もあり、V18の機能を生かしたDNSのベストプラクティスを書いてみます。

　DNSとプライバシーは国によって扱いが変わるかも知れません。国が人々のネットのアクセス状況を把握している事が問題とされている場所では、パブリックDNSが好まれます。また海外ではプロバイダーがDNSを改ざんするといったニュースも見かけます。

　日本国内においては、プロバイダのDNSの応答速度が遅い事から利用されるケースが増えてきているようです。

　ブラウザのFireFoxでは、プライバシー保護を目的として、DNSについてHTTPSを利用したDNS over HTTPSに対応しています。この機能は日本ではデフォルトでオフになっていますが、HTTPSで暗号化されているため管理者側からは一般的なネットブラウジングと区別がつかず、トラフィックが見えづらくなります。

　私個人としてはDNSを含めたプライバシーの情報を無闇に拡散させない事が重要と考えています。また、Communityで言及されている通り、防御のためにDNSのPortは空けない事が重要と考えます。

　パブリックDNSの利用はユーザーそれぞれにとっては考え方は異なるかとおもいますので、これ以降は悪意をもったクライアントが本来のDNS設定を迂回する事の対策として読んでいただければとおもいます。

{% note primary no-icon %}

## XG V18で指定DNSを強制する方法

{% endnote %}

　ここではDNS情報はDHCPで配布されている前提とします。このブログでは、クライアントが参照するDNSは、全てXGのDNSを指定するように設定しています。

　この前提で、これを回避しようとするクライアントに対して以下の対策を取ります。

1. DNS over TLS(DoT)（Port853）は拒否
2. DNS over HTTPS(DoH)は拒否
3. Public DNSへのアクセス（Port53）は、強制的にXGのDNS経由で本来のDNSにアクセス

　1および2ですが、アプリケーションは、DoTやDoHを止められると（一般的には）通常のDNS(Port53)にフォールバックします。そしてXGは強制的にDNSの向き先を変えますが、クライアントはパブリックDNSにアクセスしたと思い込んだまま、返されたIPに対しアクセスする事になります。

　上記の詳細説明です。

　1については単純にPort853を拒否する事で対応します。

　2についてはRFC8484に基づき、MIMEヘッダーの{% label info @application/dns-message %}を見つけて、その通信を拒否します。

　3についてはXGのDNATの機能を使い、WANインターフェースに対するPort53の通信だった場合、宛先IPをXGのLANのIPアドレスに変換する事で対応します。

{% note primary no-icon %}

## DoHの拒否

{% endnote %}


　DoHの定義についてサービスの登録を行います。

　XGの左ペインメニュー{% label info @Web %}の{% label info @ファイルタイプ %}から{% label info @追加 %}ボタンをクリックします。{% label info @名前 %}は{% label info @DoH %}、{% label info @テンプレート %}を空白とし、{% label info @MIMEヘッダー %}に{% label info @application/dns-message %}と入力し、{% label info @保存 %}します。

{% asset_img mimetype.png alt %}

　{% label info @Web %}の{% label info @ユーザーアクティビティ %}から追加ボタンをクリックし、先ほどDoHとして登録したカテゴリを加え、{% label info @DNS over HTTPS %}と名前を付けて保存します。

{% asset_img mimetype2.png alt %}

　続いて、具体的な拒否設定です。

　{% label info @Web %}の{% label info @ポリシー %}からご自身がFirewallルールで利用しているポリシー（ここではHome Policyを使っていると仮定しています）に、上記で登録してきた{% label default @DNS over HTTPS %}を{% label danger @拒否 %}する設定を加えます。

{% asset_img policy.png alt %}

{% note primary no-icon %}

## DoTの拒否

{% endnote %}

　XGの左ペインメニュー{% label info @ホストとサービス %}の{% label info @サービス %}から、{% label info @追加 %}ボタンをクリックし、{% label info @送信元ポート %}が1〜65535、{% label info @宛先ポート %}853を指定し、{% label info @DoT %}と名前を付け保存します。

{% asset_img service.png alt %}

　XGの左ペインメニュー{% label info @ルールとポリシー %}から新しいファイアウォールルールを追加し、以下のようにDoTを{% label danger @拒否 %}するルールを作成します。

{% asset_img rule1.png alt %}


{% note primary no-icon %}

## DNSに関するDNATの登録

{% endnote %}

　最初にDNATで必要なホストの定義を行います。LANで使っているネットワークアドレスの登録とXG自身のIPアドレスの登録が必要です。ネットワークアドレスについてIPv4は例えば、192.168.1.0/24、IPv6は例えばfd00:1234:5678:abcd::1などの登録を行います。XG自身のIPアドレスも登録が必要です。

{% asset_img host.png alt %}

　XGの左ペインメニュー{% label info @ルールとポリシー %}から、{% label info @NATルール %}を選択、{% label info @NATルールの追加 %}ボタンをクリックします。DNATは本当に理解が難しいですが、以下の通り設定します。

1. {% label info @変換前の送信元 %}は、使っているネットワークのオブジェクトを登録します
2. {% label info @変換前のサービス %}は、{% label info @DNS %}を選択します
3. {% label info @返還後の宛先（DNAT）%}は、XG自身のIPを指定します
4. {% label info @アウトバウンドインターフェース %}には、WANである、{% label info @Port2 %}を選択します
5. 最後に追加ボタンをクリックして登録を完了します

{% asset_img rule2.png alt %}

　上記はIPv4の例ですが、IPv6を利用されている方は、同様にIPv6のDNATも設定して下さい。

　上記のDNATによる、DNSのインターセプトが有効になると、{% label info @ルールとポリシー %}の{% label info @NATルール %}画面で実際の変換された数が確認できるので、これで挙動確認を行ってください。

{% asset_img rule3.png alt %}

 プロバイダーのDNS速度が極端に遅い場合はこれらの設定がベストにはなりませんが、{% label info @プライバシーと安全を鑑みたV18ならではのDNSのベストプラクティス %}になるとおもいます。

{% note primary no-icon %}

## その他DNSに関して補足すること

{% endnote %}

　GoogleDNSのDoHはRFC8484に従っていない独自プロトコルを使えるという事実があります。このため、GoogleDNSのIPアドレスを{% label info @ルールとポリシー %}で、拒否する設定を加えても良いでしょう。
