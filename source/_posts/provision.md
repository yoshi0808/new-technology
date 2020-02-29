---
title: PC（ハードウェア）の準備
date: 2020-02-25 19:33:05
tags:
 - XG Firewall
categories:
 - Security
#comments: false
---
## ネットワーク構成

---

　まず、XG Firewall(以下、XG)を導入した場合のネットワーク構成は以下の図のようになります。一般的にはプロバイダーから貸与されるホームゲートウェイ（外側の光モデム等は省略）に直接PCを繋ぐか、ホームゲートウェイの無線機能でPCやスマホを接続する事になります。XGを導入する場合は、ホームゲートウェイとPCの間にXGを挟み込む形になります。XGは無線機能を持っていないので、HUBを用意しPCを繋ぐか、無線LAN経由でアクセスする事になります。
<!-- more -->
 {% asset_img network.png alt %}  

　この構成はXGのWan側とXGのLan側と2つのネットワークを持つ事になり、XGには2枚のネットワークカード（以下、NIC）あるいは、2つ以上のPortを持っているNICを1枚用意する事になります。XGのWan側のインタフェースは、ホームゲートウェイからDHCPでプライベートIPアドレスやDNSを割り当てられます。そして、Lan側のPCやスマホのために、XGはあらかじめユーザが決めたプライベートネットワークアドレスを割り当てます。XGはこのIP割り当てのためのDHCP機能やDNS機能を持っています。また、スマホのネット接続のために無線ルータを別途用意する必要があり、この場合は無線ルータをブリッジモードでセットアップする事になります。

---

## ハードウェア構成の検討

---

　上記の構成のために、2つのネットワークPortを持ったPCが1台必要になります。XGの制約としては、6Gbyteのメモリ上限とCPUが4coreまでとなります。物理サーバにそのままXGをインストールしても良いし、ESXi等の仮想ソフトの上にVMを構築しても良いです。ESXiの場合は、ネットワークカード（NIC）の種類を選ぶらしく、intel製が好ましいという伝説があります。一般的には、以下のものが安全策で好まれるようで、自分も昔はこのNICを2枚差してXGを使っていました。

<div class="amazlet-box" style="margin-bottom:0px;"><div class="amazlet-image" style="float:left;margin:0px 12px 1px 0px;"><a href="http://www.amazon.co.jp/exec/obidos/ASIN/B00UGGX406/amazletjp-22/ref=nosim/" name="amazletlink" target="_blank"><img src="https://images-fe.ssl-images-amazon.com/images/I/31N8VAJQceL._SL160_.jpg" alt="インテル EXPI9301CT GigabitCT Desktop Adapter PCI-Express1x GbE" style="border: none;" /></a></div><div class="amazlet-info" style="line-height:120%; margin-bottom: 10px"><div class="amazlet-name" style="margin-bottom:10px;line-height:120%"><a href="http://www.amazon.co.jp/exec/obidos/ASIN/B00UGGX406/amazletjp-22/ref=nosim/" name="amazletlink" target="_blank">インテル EXPI9301CT GigabitCT Desktop Adapter PCI-Express1x GbE</a><div class="amazlet-powered-date" style="font-size:80%;margin-top:5px;line-height:120%">posted with <a href="http://www.amazlet.com/" title="amazlet" target="_blank">amazlet</a> at 20.02.26</div></div><div class="amazlet-detail">Intel <br />売り上げランキング: 301,753<br /></div><div class="amazlet-sub-info" style="float: left;"><div class="amazlet-link" style="margin-top: 5px"><a href="http://www.amazon.co.jp/exec/obidos/ASIN/B00UGGX406/amazletjp-22/ref=nosim/" name="amazletlink" target="_blank">Amazon.co.jpで詳細を見る</a></div></div></div><div class="amazlet-footer" style="clear: left"></div></div>

　今は、プロバイダーをauひかりにし、5Gbpsの契約になっているため、10GbpsのNICを使っています。もちろん、1Gbps以上の能力があったところで、個人にはそんなに太い回線は必要ありませんが・・・。なお、今現在は、ESXiで以下のNICを利用しています。

<div class="amazlet-box" style="margin-bottom:0px;"><div class="amazlet-image" style="float:left;margin:0px 12px 1px 0px;"><a href="http://www.amazon.co.jp/exec/obidos/ASIN/B01EJ4B394" name="amazletlink" target="_blank"><img src="https://images-fe.ssl-images-amazon.com/images/I/41GIXbi1guL._SL160_.jpg" alt="Intel X550-T2 Ethernet 10000 Mbit/s Internal" style="border: none;" /></a></div><div class="amazlet-info" style="line-height:120%; margin-bottom: 10px"><div class="amazlet-name" style="margin-bottom:10px;line-height:120%"><a href="http://www.amazon.co.jp/exec/obidos/ASIN/B01EJ4B394" name="amazletlink" target="_blank">Intel X550-T2 Ethernet 10000 Mbit/s Internal</a><div class="amazlet-powered-date" style="font-size:80%;margin-top:5px;line-height:120%">posted with <a href="http://www.amazlet.com/" title="amazlet" target="_blank">amazlet</a> at 20.02.26</div></div><div class="amazlet-detail">Intel <br />売り上げランキング: 116,540<br /></div><div class="amazlet-sub-info" style="float: left;"><div class="amazlet-link" style="margin-top: 5px"><a href="http://www.amazon.co.jp/exec/obidos/ASIN/B01EJ4B394" name="amazletlink" target="_blank">Amazon.co.jpで詳細を見る</a></div></div></div><div class="amazlet-footer" style="clear: left"></div></div>

　このNICだと、1つのPCI Expressバスにこのカード1枚を刺し、WanとLanのインタフェースを用意できます。

　これ以外にも、[Shuttle](https://shuttle-japan.jp/)という会社のベアボーンをXG向けに使っている方もいらっしゃるようです。いずれにしてもESXiを使う場合は、NICの種類を選ぶという事もあり、Hyper-Vの方が身近な存在なのでしょうか。

---

## 番外編

---

　なお、番外編として、当初使っていた~~中華のバッタもん~~小型PCも紹介したいとおもいます。

<div class="amazlet-box" style="margin-bottom:0px;"><div class="amazlet-image" style="float:left;margin:0px 12px 1px 0px;"><a href="http://www.amazon.co.jp/exec/obidos/ASIN/B07SNS9D9N" name="amazletlink" target="_blank"><img src="https://images-fe.ssl-images-amazon.com/images/I/41O4MQkV5VL._SL160_.jpg" alt="Intel NUC Kit Celeron J1900搭載 4LAN 4G RAM 60G SSDポータブルMini PC 小型デスクトップPC ファンレスPC" style="border: none;" /></a></div><div class="amazlet-info" style="line-height:120%; margin-bottom: 10px"><div class="amazlet-name" style="margin-bottom:10px;line-height:120%"><a href="http://www.amazon.co.jp/exec/obidos/ASIN/B07SNS9D9N" name="amazletlink" target="_blank">Intel NUC Kit Celeron J1900搭載 4LAN 4G RAM 60G SSDポータブルMini PC 小型デスクトップPC ファンレスPC</a><div class="amazlet-powered-date" style="font-size:80%;margin-top:5px;line-height:120%">posted with <a href="http://www.amazlet.com/" title="amazlet" target="_blank">amazlet</a> at 20.02.26</div></div><div class="amazlet-detail"> <br />売り上げランキング: 40,945<br /></div><div class="amazlet-sub-info" style="float: left;"><div class="amazlet-link" style="margin-top: 5px"><a href="http://www.amazon.co.jp/exec/obidos/ASIN/B07SNS9D9N" name="amazletlink" target="_blank">Amazon.co.jpで詳細を見る</a></div></div></div><div class="amazlet-footer" style="clear: left"></div></div>

　XCYという会社のPCなんですが、これはもう、怪しさ満点です。一応1GbpsのネットワークPortが4つも付いているし、それなりに安いし、魅力的に映りました。この時は仮想環境を使わず、物理に直接インストールして実際にXGを使ってました。が、speedtest.netでパフォーマンスが200Mbps程度しか出なかったので、結局それなりのスペック（Core i7）のマシンを購入してセットアップし直した経緯があります。ファンレスという記載もありますが、「**ファンが付いてないだけ**」です。**すごく、熱いです・・・**。取り敢えず、チャレンジャーを自負する方は試してみても良いのではないでしょうか。なお、現在この会社のホームページは見つからないのですが、いくつかのサイトで販売されているのを見かけます。何台かAmazonにも出品されているようですが、私が注文した1年半前は、ネットワークが100Mbpsの製品も混ざっていましたのでご注意ください。さらに、当時のこの会社のホームページで掲載されていた画像を保存してあったので、ここで掲載しておきます。

 {% asset_img 1477389879115186.jpg alt %}

 まさに敵なしというか、ある意味清々しくて、とっても素敵です。
