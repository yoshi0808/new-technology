---
title: IPv6のUnique Local Addressを生成する
tags:
  - IPv6
  - XG Firewall
categories:
  - Network
date: 2020-04-18 21:16:31
---
<p class="onepoint">この記事で実現すること</p>
プライベートなIPv6アドレスを利用するため、機器のMACアドレスを用いて、Unique Local Address（ULA）を生成します。

<!-- more -->

## IPv6 Unique Local Address（ULA)について

IPv6はその広大なアドレス空間により、NATを必要としません。ホームユーザー向けのインターネットサービスにおいても、多くのプロバイダでパブリックIPv6が振られ、NAT変換無しでインターネットに接続できます。ただしホームユーザー環境においての実運用としては、パブリックIPアドレスが変わった場合に宅内のIPアドレスも変更しなければならず、内側のホスト間通信の運用が困難になります。Firewallなど内部ホストを管理する必要のあるネットワークでは、IPv4のプライベートIPに近い考えであるIPv6のULAを使い、インターネットに対してはNAT変換することが考えられます。厳密には、ULA≠プライベートIPアドレスなので、外部のサイトとは重複しないアドレスを利用する事が求められます。

ULAは、MACアドレスと時刻からおおよそ一意となるIPv6アドレスを作成することが可能となります。アドレスは、`fd00::/8`から始まる48ビットのプリフィックス（prefix）を持ちます。従い、`fdxx:xxxx:xxxx::/48`のプリフィックスに加え、`0000`〜`ffff`までのサブネットの範囲を持ちます。

`fdxx:xxxx:xxxx:0000::/64` - `fdxx:xxxx:xxxx:ffff::/64`

## IPv6 ULAの生成を行う

ULAを求めるPythonプログラムを私の方で用意し、**JDoodle**に配置しています。JDoodleでPythonプログラムを実行できます。JDoodleは、教育用としてプログラムソースコードを登録すると、プログラムが実行できる機能を提供しています。<sup><b>[[1]](#note1)</b></sup>

最初にIPv6を割り振りたいホストのMACアドレスを調べておいてください。算出時にMACアドレスを入力するので、`XX:XX:XX:XX:XX:XX`または`XX-XX-XX-XX-XX-XX`と表示されているMACアドレスを予めコピーしてください。大文字小文字はどちらでも構いません。また、仮想環境でサーバーなどを構築されている場合は仮想MACアドレスではなく、物理MACアドレスを採用される事をお勧めします。

> JDoodle -ULA Generator-
 <https://www.jdoodle.com/a/20tR>

{% asset_img jdoodle1.png 800 alt %}

1. 入力エリア　{% label primary@Stdin Inputs %}
2. 実行ボタン　{% label primary@▶︎Execute %}
3. 実行結果　{% label primary@Result %}

{% asset_img jdoodle.png 800 alt %}
{% label primary@Stdin Inputs %}に入力します。MACアドレスを貼り付け、{% label primary@▶︎Execute %}ボタンをクリックしてください。

{% label primary@Result %}に、以下の4つの項目が表示されます。これらがプライベート環境で利用するユニークなIPv6アドレスです。MACアドレスが正しく入力されなかった場合は、"Bad MAC Adderss"と表示されます。

### IPv6 ULAのプログラムについて

- RFC4193に基づき生成しています
- MACアドレスから{% label primary@Modified EUI-64 %}を生成するにあたり、RFC4291に基づき生成しています
- 本来はNTPを利用してハッシュキーの一部に利用しますが、通信は行わずホストの時間を取得し、NTP時刻に変換しています
- NTPは64ビットのデータ型となっており、2036年にオーバーフローします。しかし、RFC4330で定義されているように再び0から開始し、正しく動く処理をしています
- JDoodleサイトは2021年10月17日時点でCookieを求められます。
- ソースコードはGitHubのリポジトリにあります。
 <https://github.com/yoshi0808/ula-generator>

<small id="note1">**[1]**
JDoodleの利用規約などを探してみましたが見つかりませんでした。学生向けに教育用としての利用を想定されているようです。このブログの目的から鑑み、利用目的が逸脱している事は無いと考え、利用させていただいております。
</small>
