---
title: IPv6のUnique Local Addressを生成する
tags:
  - IPv6
  - XG Firewall
categories:
  - Code
date: 2020-04-18 21:16:31
---

{% note success  %}

## この記事で実現する内容について

個人向けのユニークなIPv6アドレスが必要となった場合、自分の持つ機器のMACアドレスを用いて、Unique Local Address（ULA）を生成します。プログラムの実行が必要なので、外部サイトの[JDoodle](https://www.jdoodle.com/)サイト上でPython3のコードを実行してULAを求めます。

{% endnote %}
<!-- more -->

{% note primary no-icon %}

## IPv6 Unique Local Address(ULA)について

{% endnote %}

　IPv6はその広大なアドレス空間により、NATを必要としません。個人向けのインターネットサービスにおいても、大部分のプロバイダでパブリックIPv6が振られ、NAT変換無しでインターネットに接続できます。ただし宅内に目を向けると、パブリックIPアドレスが変わった場合に宅内のIPアドレスも変更しなければならず、内側のホスト間通信の運用が困難になります。Firewallなど内部ホストを管理する必要のあるネットワークでは、IPv4のプライベートIPに近い考えであるIPv6のULAを使い、インターネットに対してはNAT変換を行うという方法が考えられます。

　IPv6アドレスは、以下の通りのアドレス体系になっており、128ビットで表します。
　”xxxx:xxxx:xxxx:xxxx:xxxx:xxxx”
　1つのネットワークは64ビットのサブネット固定となります。

　ULAは、MACアドレスと時刻からおおよそ一意となるIPv6アドレスを作成する事が可能となります。アドレスは、fd::/8から始まる48ビットのプリフィックス（prefix）を持ちます。従い、fdxx:xxxx:xxxx::/48のプリフィックスに対して、以下のとおりのサブネットの範囲を持ちます。

　fdxx:xxxx:xxxx:0000 〜 fdxx:xxxx:xxxx:ffff

{% note primary no-icon %}

## IPv6 ULAの生成を行う

{% endnote %}

　[JDoodle](https://www.jdoodle.com/)サイトに配置したULAを算出するPythonプログラムを実行します。
　JDoodleは外部サイトであり、このページでは、JDoodleのサイトを埋め込んで表示しております。ここで入力されたデータはJDoodleサイトに渡され、実行されます事をご承知おきください。
　最初にIPv6を割り振りたいホストのMACアドレスを調べておいて下さい。プログラム実行時にMACアドレスを入力するので、{% label info @XX:XX:XX:XX:XX:XX %}と表示されているmacアドレスを予めコピーしておくと便利かとおもいます。また、仮想環境でサーバーなどを構築されている場合は仮想MACアドレスではなく、物理MACアドレスを採用される事をお勧めします。

　以下にPython3のソースコードとその下に3つの項目があります。

1. 入力エリア　{% label info @Stdin Inputs %}
2. 実行ボタン　{% label info @▶︎Execute %}
3. 実行結果　{% label info @Result %}

<div data-pym-src="https://www.jdoodle.com/embed/v0/20tR?stdin=1&arg=0"></div>

　上記の{% label info @Stdin Inputs %}に直接入力が可能です。MACアドレスを貼り付け、{% label info @▶︎Execute %}ボタンをクリックしてください。
　{% label info @Result %}に、以下の4つの項目が表示されます。MACアドレスが正しく入力されなかった場合は、Bad MAC Adderssと表示されます。

```bash
Input MAC address: 
ULA Prefix        -> fd00:1234:5678::/48
First Subnet      -> fd00:1234:5678::/64
Last Subnet       -> fd00:1234:5678:ffff::/64
First IPv6 Address-> fd00:1234:5678::1/64
```

　これで他とのIPv6アドレスの重複が極めて少ないULAの生成ができました。

{% note primary no-icon %}

## IPv6 ULAの生成ソースコードについて

{% endnote %}

　ソースコードは[Github](https://github.com/yoshi0808/ula-generator)にあります。

 - RFC4193に基づき生成しています
 - MACアドレスから{% label info @Modified EUI-64 %}を生成するにあたり、RFC4291に基づき生成しています
 - 本来はNTPを利用して乱数に近い64ビットのハッシュキーを生成しますが、プログラムをシンプルにするため、ホストの時間を取得し、NTP時刻に変換しています
 - NTPは64ビットのデータ形となっており、2036年にオーバーフローします。しかし、RFC4330で定義されているように再び0から開始するような（正しく動く）処理となっています

<script src="https://www.jdoodle.com/assets/jdoodle-pym.min.js" type="text/javascript"></script>
