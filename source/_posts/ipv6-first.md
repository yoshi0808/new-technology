---
title: IPv6のULAをIPv4より優先する
tags:
  - XG Firewall
  - IPv6
categories:
  - Network
date: 2021-06-26 09:22:51
---



{% asset_img title.png alt %}
<p class="onepoint">この記事で実現すること</p>

Firewallなどルーターの内側（LAN）がユニークローカルアドレス（ULA）となるネットワーク構成、かつ、NATでインターネットに接続しているIPv4、IPv6のデュアルスタック環境では通常IPv4が優先されます。クライアント側のWindowsおよびLinuxではシステム設定変更を行う事でULA環境下でもIPv6を優先させる事ができます。

<!-- more -->

## IPv4を優先するULA

現時点でIPv6/IPv4の優先度を確認する方法の1つは、[http://www.kame.net](http://www.kame.net)にブラウザでアクセスし、亀が踊っていればIPv6接続、動かなければIPv4接続という事になります。プロバイダのWebサイトの右上に「IPv6（IPv4）で接続しています」との記載も見かけます。

ブラウザやOSがIPv6優先であっても、ULAそのものはインターネットにルーティングしないという大前提があります。IPv6において、NATは一般的に推奨されない構成でもあります。

OSの設定を変更することで、ULAを使いながらIPv6優先に変更する事ができます。

## IPv6優先設定

IPv6やIPv4の通信優先度を決定するPrefixポリシーというものがあり、これをIPv6優先にします。ネットワークのグループ（Prefix）毎に優先度を決めます。Windows、Linuxで設定は異なりますが、概念は同じです。残念ながらmacOS（Catalina）やスマホについては、この設定を見つける事ができませんでした。

### Prefixポリシーの説明

Windowsの場合、このPrefixポリシーを表示させると以下の表示がされます。
```
C:\> netsh interface ipv6 show prefixpolicies

優先順位   ラベル  プレフィックス
----------  -----  --------------------------------
        50      0  ::ffff:0:0/96
        40      1  ::1/128
        30      2  ::/0
        20      3  2002::/16
         5      5  2001::/32
         3     13  fc00::/7
         1     11  fec0::/10
         1     12  3ffe::/16
         1      4  ::/96
```

各プレフィックスの説明は以下の通りです。

>| **Prefix**    | **説明** |
>| ------------- | -------- |
>| ::1/128       | Loopback |
>| ::/0          | グローバルスコープ      |
>| 2002::/16     | 6to4        |
>| ::/96         | IPv4互換アドレス（廃止）         |
>| ::ffff:0:0/96 | IPv4マップドアドレス         |
>| fec0::/10     |サイトローカルアドレス（廃止）          |
>| fc00::/7      |ユニークローカルアドレス        |
>| 2001:0::/32   |   Teredo       |

IPv4マップドアドレスは、IPv6の世界でIPv4を表現したものです。具体的には、`::ffff:192.168.0.1`という形となり、IPv6アドレスの前半64ビットは0、65〜96ビットの32ビットが`ffff`、97ビット〜128ビットの32ビットがIPv4アドレスとなります。
"グローバルスコープ"は、0ビットのマスクなので全てのアドレスにマッチします。インターネットのIPv6アドレスであるグローバルユニキャストアドレス（GUA）は`2000::/3`ですが、このPrefixポリシー上ではグローバルスコープが該当します。
`fc00::/7`はおなじみULAです。

設定のポイントは2箇所です。
- 優先度は数字が大きいものほど優先度が高く、IPv6 Loopback → ULA → グローバルスコープ → IPv4マップドアドレスの順に並べます
- ULAからインターネット宛（GUA）にルーティングを認めるために、ネットワーク単位に割り振られているラベルについてULAとグローバルスコープのラベルを同じ数字にします

### Windows10

1. コマンドプロンプトを**管理者権限**で実行します。
2. 出力結果は環境によって異なりますが、概ね以下のように出力されます。
 ```
 C:\>netsh interface ipv6 show prefixpolicies
 アクティブ状態を照会しています...

 優先順位   ラベル  プレフィックス
 ----------  -----  --------------------------------
         50      0  ::ffff:0:0/96
         40      1  ::1/128
         30      2  ::/0
         20      3  2002::/16
          5      5  2001::/32
          3     13  fc00::/7
          1     11  fec0::/10
          1     12  3ffe::/16
          1      4  ::/96
 ```
3. IPv6 > IPv4となるよう、管理者権限で以下のコマンドを1行づつ投入します。
 ```
 netsh interface ipv6 set prefixpolicy ::ffff:0:0/96 25 0
 netsh interface ipv6 set prefixpolicy ::1/128 40 1
 netsh interface ipv6 set prefixpolicy ::/0 30 2
 netsh interface ipv6 set prefixpolicy 2002::/16 20 3
 netsh interface ipv6 set prefixpolicy 2001::/32 5 5
 netsh interface ipv6 set prefixpolicy fc00::/7 35 2
 netsh interface ipv6 set prefixpolicy fec0::/10 1 11
 netsh interface ipv6 set prefixpolicy 3ffe::/16 1 12
 netsh interface ipv6 set prefixpolicy ::/96 1 4
 ```
 {% note info  %}
 設定するラベルと優先度はこの例示に拘らず、お使いのPCが示す内容を修正してください。
 {% endnote %}

1. 設定内容を改めて確認します。
{% asset_img prefix.png 480 alt %}

これで設定完了です。OSを再起動して設定が変わっていない事、IPv6が優先されている事を確認してください。設定をやり直す場合は、PrefixPolicyをリセットしてからOSを再起動します。

`netsh interface ipv6 reset`

### Linux(ubuntu)

Linux（ubuntu）の場合は、`/etc/gai.conf`に設定ファイルがあります。

1. viなどでファイルを開きます。`sudo vi /etc/gai.con`
2. ファイルの中身は全てコメントアウトされています。plefixpolicyは以下の通りです。
 ``` bash
 label   <mask>   <value>
 #    Add another rule to the RFC 3484 label table.  See section 2.1 in
 #    RFC 3484.  The default is:
 #
 #label ::1/128       0
 #label ::/0          1
 #label 2002::/16     2
 #label ::/96         3
 #label ::ffff:0:0/96 4
 #label fec0::/10     5
 #label fc00::/7      6
 #label 2001:0::/32   7
 ```
 つまり、コメントされた状態がデフォルト設定であり、カスタマイズが必要な場合はコメントを外して対応できるようになっています。
1. 上記の8行あるplefixpolicyについて**すべてのコメントを外し**、ULA`fc00::/7`のラベル6を`::/0`のラベルである2に修正します。
2. 続いて、このファイルのさらに下を見ていくと優先度の項目が並びます。

 ``` bash
 #precedence  ::1/128       50
 #precedence  ::/0          40
 #precedence  2002::/16     30
 #precedence ::/96          20
 #precedence ::ffff:0:0/96  10
 ```

 ネットワーク（Prefix）毎に優先度を決めています。Windowsと設定する項目の意味は同じです。
3. 5つの行のコメントを外し、ULAのリストを加えます。Loopback→→ULA→`::/0`→IPv4の並びにします。修正後は以下になります。

 ``` bash
 label ::1/128       0
 label ::/0          1
 label fc00::/7      1
 label 2002::/16     2
 label ::/96         3
 label ::ffff:0:0/96 4
 label fec0::/10     5
 label 2001:0::/32   7

 precedence  ::1/128       50
 precedence  fc00::/7      45
 precedence  ::/0          40
 precedence  2002::/16     30
 precedence ::/96          20
 precedence ::ffff:0:0/96  10
 ```

 4. ファイルを保存し、OSを再起動します。

なお、LinuxでmDNS（Bonjour）が使える環境にあり、LANにおける名前解決がIPv4指定となっている場合は、`/etc/nsswitch.conf`を修正する事でIPv6対応に変更可能です。
``` bash
# 以下の行をコメントアウトします
#hosts:          files mdns4_minimal [NOTFOUND=return] dns
# 代わりに以下の行を追加します
hosts:          files mdns_minimal [NOTFOUND=return] dns
```

以上でIPv6が優先となります {% emoji turtle %}

## getaddrinfo()

送信元IPアドレスと送信先アドレスでPolicyによってどのネットワークを使うかは、[RFC6724](https://datatracker.ietf.org/doc/html/rfc6724)で詳細が記載されています。

多くのアプリケーションは、getaddrinfo()という関数を使い、URLから名前解決されるとともに、プレフィックスポリシーを踏まえてIPv4またはIPv6の優先度が決定されます。
nslookupで`google.com`を見てみます。

```
$ nslookup google.com.
Server:		127.0.0.53
Address:	127.0.0.53#53

Non-authoritative answer:
Name:	google.com
Address: 172.217.xxx.110
Name:	google.com
Address: 2404:6800:4004:xxxx::200e
```

上記のようにIPv4とIPv6のアドレスが両方定義されています。
getaddrinfo()はpythonのインタラクティブシェルで確認できます。以下はIPv6が優先のケースです。

``` python
>>> import socket
>>> socket.getaddrinfo("google.com", 80, proto=socket.IPPROTO_TCP)
[(<AddressFamily.AF_INET6: 10>, <SocketKind.SOCK_STREAM: 1>, 6, '', ('2404:6800:4004:xxxx::200e', 80, 0, 0)), (<AddressFamily.AF_INET: 2>, <SocketKind.SOCK_STREAM: 1>, 6, '', ('172.217.xxx.110', 80))]
```
1-2行目で関数を呼び出し、3行目の関数の出力はタプル（List形式）で2要素あります。0番目の要素にIPv6アドレスが入り、1番目の要素にIPv4アドレスがあります。PrefixPolicyをIPv4優先に変更した場合は、このレスポンスの順番が入れ替わります。
macOSでは0番目の要素にIPv4アドレスを返します。
``` python
>>> import socket
>>> socket.getaddrinfo("google.com", 80, proto=socket.IPPROTO_TCP)
[(<AddressFamily.AF_INET: 2>, <SocketKind.SOCK_STREAM: 1>, 6, '', ('172.217.xxx.238', 80)), (<AddressFamily.AF_INET6: 30>, <SocketKind.SOCK_STREAM: 1>, 6, '', ('2404:6800:4004:XXXX::200e', 80, 0, 0))]
```
[RFC6724](https://datatracker.ietf.org/doc/html/rfc6724)を読んでいると色々な設定が見られます。例えば以下のようにIPv6のリンクローカルアドレスの優先度をグローバルよりも下げてしまうなどです。

>10.4.  Configuring Preference for Link-Local Addresses
>The destination address selection rules give preference to destinations of smaller scope.For example,a link-local destination will be sorted before a global scope destination when the two are otherwise equally suitable.An administrator can change the policy table to reverse this preference and sort global destinations before link-local destinations:

>宛先アドレス選択ルールは、**スコープの小さい宛先が優先されます**。 例えば、リンクローカルな宛先は、グローバルな宛先と同等に適している場合にグローバルな宛先よりも優先されます。管理者はポリシーテーブルの優先順位を逆転させることで、リンクローカルな宛先よりもグローバルな宛先を優先するように変更できます。


``` bash
      Prefix        Precedence Label
      ::1/128               50     0
      ::/0                  40     1
      ::ffff:0:0/96         35     4
      fe80::/10             33     1
      2002::/16             30     2
      2001::/32              5     5
      fc00::/7               3    13
      ::/96                  1     3
      fec0::/10              1    11
      3ffe::/16              1    12
```

※（補足）スコープの小さい宛先が優先されるというのは、送信先アドレスと送信元アドレスの上位ビットからの一致ビット数によって決定されることでロンゲストマッチアルゴリズムと呼ばれます。`fdxx〜`のULAアドレスは`::/0`と`fc00::/7`とにマッチしますが、優先度が高い`::/0`にマッチするのではなくて、一致ビット数が多いもの、つまり`fc00::/7`にマッチします。その上で、getaddrinfo()で有効なネットワークが複数あればそこで初めて優先度について評価されます。

上記の例は自身のホストにグローバルなIPv6アドレスが振られている事を想定しているはずで、今回のようなULAを使うケースとはまた違うシチュエーションですので、あくまで参考となります。

## Happy Eyeballs

Happy Eyeballsは、ブラウザに実装されている機能で、IPv6を優先しつつも、IPv4と応答の早い結果を採用するという合理的な仕組みです。Happy Eyeballsは[RFC6555](https://datatracker.ietf.org/doc/html/rfc6555)、Happy Eyeballs ver2については、[RFC8305](https://datatracker.ietf.org/doc/html/rfc8305)で定義されています。Eyeballsというのはユーザーを意味します。ユーザーにとってハッピーな仕組みという事でしょうか。用語解説は[こちら](https://dictionary.cambridge.org/dictionary/english/eyeballs)を参照してください。

LANから挙動を見る限り、IPv6を優先としたOSでの挙動はブラウザからもIPv6が優先されているように見えます。macOSやiPhoneで見る限りは応答の早い方に接続するようです。["Test your Happy Eyeballs(http://he.test-ipv6.com)"](http://he.test-ipv6.com)では、その挙動を確認できます。

{% asset_img he.png 800 alt %}

私の環境ではmacOSが6:4、iOSが7:3でそれぞれIPv4が多く選択されました。このサイトではランダムなホスト名を生成し、そこに毎秒接続確認をする手法を取っているようです。ただし、このサイトに限らずULA環境におけるmacOSでは一度接続した情報がOS上のキャッシュに残ると次からはIPv4に接続します。ネットワークのキャプチャを見ると、名前解決ではAAAAレコードとAレコードとを同時にクエリ要求しますが、キャッシュされた接続先がある場合はIPv6には接続せずIPv4のみ接続開始しています。OS内部ではLinux同様にPrefix管理テーブルがあるものと考えられます。

”test-ipv6.com”についてIPv4のFirewallルールで拒否する設定をするとエラー無くIPv6で接続されます（macOSのSafariの場合）。

{% asset_img he2.png 800 alt %}

可用性としては優れた仕組みですが、IPv4の国別フィルタで意図的に宛先国をブロックする運用をしている場合、IPv6の国別フィルタの機能がFirewallに無ければセキュリティリスクに見えます。ホームユーザーにとってリスク対策のためにIPv6を無効にするまでは無いと考えていますが、こういったブラウザの挙動も頭の片隅に置いておく必要がありそうです。
