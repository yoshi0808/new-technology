---
title: XG FirewallでIPv6の設定を行う（前半）
tags:
  - IPv6
  - XG Firewall
categories:
  - Security
date: 2020-04-25 15:00:17
---


{% note success  %}

## この記事で実現する内容

　XG FirewallからホームゲートウェイとをIPv6で接続し、IPv6ホストの名前解決が行えるか確認します。

{% endnote %}

<!-- more -->

{% note primary no-icon %}

## IPv6を取り巻く環境

{% endnote %}

　いつかは枯渇すると言われているIPv4アドレスですが、欧州を管轄するRIPE NCCから、2019年11月25日に欧州のIPv4アドレスが枯渇したと発表されました。インターネットにいきなり大きく影響が出てくる事はありませんが、これからは徐々にIPv4だけでは接続出来ないサイトが出てくるものと思われます。

　IPv6の接続方式は、PPPoEの接続方法とIPoEの2通りの接続方法があります。プロトコル自体に優劣はさほどありません。いろいろな記事ではPPPoEが劣っているという書き振りを見かける事が多いのですが、これは大手回線業者の固有事情によるものです。実態としては単にIPv6のユーザーが少なく、途中のネットワークが空いている事が多いだけで、プロトコルとして高速なわけではありません。ただ現状の環境からすると、IPv6ネットワークはまだ将来を見据えて余裕がある状態である事は間違いなく、混雑しづらい状況にあります。

　IPv6は実質無限といっていいほどのアドレス空間を持ちます。IPアドレスは例を挙げると、{% label info @2001:0db8:0000:0000:3456:0000:0000:0000 %}のように表記が長く、管理する側もIPv4に比べて大変です。ホームユーザーとしては、宅内のIPアドレス管理の主体はIPv4としつつ、IPv6のサイトへのアクセスも可能というくらいに考えておく事が必要です。
　インターネットの接続業者によってはネット契約とは別にIPv6を改めて申し込む必要があります。大半の接続業者ではIPv6の利用は無料です。

{% note primary no-icon %}

## IPv6の設定にあたって

{% endnote %}

　XG FirewallはIPv6に対応しています。回線業者およびプロバイダがIPv6のサポートをしている前提で、ホームゲートウェイ（HGW）に接続する形態を想定しています。XGからHGWには普通にIPv6としてのネットワーク通信を行います。そういう意味ではIPoEとも言えます。貸与されているHGWとXGとのIPv6接続が正しく行えるかが最初のハードルとなります。この記事では、ホームゲートウェイからXGにてIPv6アドレスを割り当てられ、XGからIPv6でインターネットへのアクセスが可能か確認します。

　また、制約としてAndoroidはXGの構成によってはIPv6を使えない可能性があります。

{% note primary no-icon %}

## ホームゲートウェイからIPv6アドレスの配布を受ける

{% endnote %}

　HGWから配布されるIPアドレスは、従来のIPv4であればDHCPの機能となりますが、IPv6の場合は以下の2通りがあります。

1. DHCPv6
2. Router Advertisement

　最近の機械だとHGWに設定する箇所もなく、IPv6の契約があれば、プロバイダからIPoEでIPv6の接続が可能になっている状況もあるようです。XGは、上記いずれの方法でもHGWからのパブリックIPアドレスを受け取れるようです。

　XGのPort2（WAN側）でIPv6の設定を行います。XGの左ペインメニューから、{% label info @ネットワーク %}の{% label info @インターフェース %}を選び、{% label info @Port2 %}をクリックします。

{% asset_img network.png alt %}

1. {% label info @IPv6設定 %}のチェックボックスをOnにします
2. {% label info @IPの割り当て %}はDHCPを選びます
3. {% label info @モード %}は{% label info @手動 %}、{% label info @ステートレス %}、{% label info @DHCPから他の設定を承認 %}を選択します
4. {% label info @ゲートウェイ名 %}は{% label info @IPv6_GW %}など、自由に命名してください
5. {% label info @保存 %}をクリックすると下記の確認画面が表示されます
 {% asset_img update.png alt %}
6. {% label info @インターフェースを更新 %}をクリックすると、以下の通り、パブリックIPv6アドレスがHGWより割り当てられます
    {% asset_img update2.png alt %}

　続いてDNSの設定です。XGの左ペインメニューから{% label info @ネットワーク %}を選び、{% label info @DNS %}をクリックします。IPv6の項目があり、初期設定ではスタティックの設定となっています。HGWの{% label info @fe80: %}からはじまるリンクローカルアドレス、またはホームゲートウェイのパブリックIPアドレスが指定されています。もしHGWからリンクローカルIPアドレスが配布されている場合は、その値を削除しプロバイダが提供するDNSのIPアドレスを調べ、そのIPを設定してみて下さい。これはHGWの種類やプロバイダなど環境によって異なりますので、この設定でうまくいかない場合は、IPv6でもDHCPの設定を行うなどしてみてください。

　ここの設定が難しいのは以下の通りと考えています。

 1. HGWからIPアドレスを配布する時に、ゲートウェイやDNSの情報も配布されますが、その方法は複数あります。
 2. 単にクライアントがHGWのDNSを参照してインターネットに接続するのは問題ありませんが、XGの配下のさらに別ネットワークの端末がHGWのfe80::/16から始まるリンクローカルアドレスには、セグメントを超えてアクセスする事は出来ません。
 3. IPv6のパブリックIPアドレスはもちろんその時々で変わる可能性があります。従いDNSとして、HGWの持つパブリックIPアドレスをクライアントに配布出来ません。

　これらの問題に対処するため、私は手動でプロバイダのDNSのIPアドレスを設定しています。

 {% asset_img update3.png alt %}

　また、HGWに対してXGからDNSクエリを実行したところで結局はプロバイダのDNSへ問い合わせする事になります。従い効率化のために、私はXGのIPv4DNSもプロバイダのDNSを指定しています。実運用としてプロバイダのDNSのIPアドレスは殆ど変更される事がありません。

　環境によっては少し難しいIPv6設定ですが、次に設定が環境と合っているか診断を行います。

　XGの左ペインメニューから{% label info @診断 %}を選んでください。{% label info @名前参照 %}から、{% label info @DNSサーバーIP %}を{% label info @すべての設定済みサーバーを使用して参照 %}を選択し、{% label info @名前参照 %}をクリックしてください。

 {% asset_img diag.png alt %}

　正常な場合は以下の通り、設定したIPv4とIPv6のDNSでipv6.google.comの名前解決をした結果と計測時間を表示します。

 {% asset_img diag2.png alt %}

　診断結果がうまくいかない場合は、先のDNS設定と、HGWからのIP配布方法などの設定をいくつか試してみてください。