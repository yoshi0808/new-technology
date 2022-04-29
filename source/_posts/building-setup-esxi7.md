---
title: ESXI7.0をRyzen7 5700Gで構築
date: 2022-02-27T12:58:48+09:00
tags: ESXi
categories: Hardware
---

<p class="onepoint">この記事で実現すること</p>

最近、改めて無償版ESXi7.0向けのハードウェアをRyzen CPUをベースにセットアップし直したので参考までに掲載します。vmの動作などは全く問題ありませんが、ESXi自身のセキュアブートだけはうまくいきませんでした。参考になればと思い記録を残します。

<!-- more -->

## ESXi7のためのハードウェア選定検討

ハードウェア選定については以下のポリシーとしました。私はパワーユーザーではなく、1つの仮想マシン（vm)に大きな能力を求めていませんが、LinuxやFirewallなどを中心にvmの数だけは増えていきそうな気がします。これまで使っていたハードウェアは10GBase-TのNICも含めてかなり熱を出していたのでもう少し省電力を求めて探しました。

- CPUは多くのvmを動かすことが想定されるが省電力を意識したい
- 筐体はスリムタイプ（Micro-ATX）でグラフィックカードは積まず貴重なPCIeスロットはネットワークカードに使う
- ネットワークカードはintelかMellanoxが候補。熱対策が必要なので10Gbase-Tではなく、SFP+を中心に検討
- ストレージは高速化のためNVMeにしたい

## ハードウェア構成

以下のハードウェア構成となりました。

| パーツ       | 製品名                                            |
| ------------ | ------------------------------------------------- |
| CPU          | Ryzen7 5700G 3.8GHz(Radeon Graphics)              |
| マザーボード | GIGABYTE B550M S2H Micro-ATX                      |
| メモリ       | SanMax DDR4-3200 1.2Volt Skhynix(88H) 32GB x 2    |
| NVMe         | Samsung 970EVO Plus PCIE x Gen3 x 4 1TB           |
| SSD          | WesternDigital Blue 500GB                         |
| NIC          | ipolex OEM (intel X710 chipset) 10GbE SFP＋ 4Port |
| 電源         | スリムタイプ 300W電源                             |

キーボード・マウス・NICを除き163,480円でした。NICはダイレクトアタッチケーブル2本を含め$531でした（送料と関税入れると＄580程度）。

### CPU

毎回の説明ですが、ESXiにおいてはリテール向けのCPUは公式にサポートされていません。intelのCore iシリーズは鉄板ですが、AMD Ryzenでも動くようだという記事もちらほら見かけるようになりました。ESXi7.0になって、AMDのZEN3アーキテクチャをサポートするという内容（具体的にはEPYCに対応する）についてVMWareの方が説明しているビデオを見た事があり、ZEN3アーキテクチャのRyzenなら安定動作が見込めるのではないかと考えました。 私の場合省電力のPCを必要としていました。省電力ながらCPU8コア16スレッドは魅力です。Ryzen7 5700GはTDP65Wなので、全体で100W程度の省電力マシンを構築することを目標としました。ヘッドレスシステム、いわゆるキーボードもマウスもディスプレイ（グラフィックカード）も持たないESXiでのGPUレスのセットアップもあるようですが、トラブル時の緊急対応や後々のクライアントPCとしての再利用も視野に入れ、GPU付きのCPU(APU)を選択しました。

### マザーボード

秋葉原のパソコンSHOPアーク（Ark)にカスタマイズモデルがあり、それをベースに選択しました。無線LANや2.5GbEなども使う必要がないのでシンプルなマザーボードのGIGABYTE B550M S2H Micro-ATXを選定しました。

{% asset_img B550SH2.png 1000 alt %}


### メモリ

安定していると評判の国内メーカーのものを選定しました。

### ストレージ

VMware Commmunityで970EVO Plusが動作するという情報が数件あったのでそれを参考に選定しました。980 Proなどそれ以上の魅力的な製品もありますが、Ryzen7 5700Gを選定しているため、PCIe x 3の制約があり、その上限に合わせた製品にしました。

{% asset_img 970evo.png 1000 alt %}

### ネットワークカード

それなりの数のvmを動作させるとなると必然的にNICは10Gbpsを用意したくなります。過去からintel X550-T2を使ってきてそのまま使い続けるのでも良かったのですが、私の場合、クローゼットに光回線とモデム、CD管が集約されてしまっていることから、そこにあまり熱の出すハードウェアを置けません。次回はSFP/SFP+にしようと決めていました。が、NICについては昨今の半導体不足で、欲しいカードは殆ど品切れの状態です。それでAmazon.comでipolexというSFPメーカーがOEM提供しているintel X710のチップが乗った4Portの10GbEカードを購入しました。intel純正のX710のSFP+4Portはフルハイトのカードですが、このipolex社のNICはロープロファイルでしたので私にとっては都合が良いものでした。Mellanoxも良かったのですが主力製品は40Gの世界に移行しており、企業向けのイメージが強くあまり選定に前向きになれませんでした。Connect X-4が対象になります。

{% asset_img ipolex.png 640 alt %}

なお、2022-4-29時点でこのネットワークカードもあっという間に売り切れてしまってます。。。

## ESXi7.0u3cのインストール

### UEFIの設定

UEFIについては、以下の項目を設定しました。

| 項目名      | 設定値   |
| ----------- | -------- |
| SVM mode    | Enable   |
| Fast Boot   | Disable  |
| CSM Support | Disable  |
| Secure Boot | Advanced |

しかし、最終的にはセキュアブートでインストールされませんでした。

ESXiは事後にもセキュアブートに変更できるのですが、うまくいきません。

```
[root@esxi:~] /usr/lib/vmware/secureboot/bin/secureBoot.py -c
Secure boot can be enabled: All vib signatures verified. All tardisks validated. All acceptance levels validated
[root@esxi:~]

[root@esxi:~] esxcli system settings encryption set --require-secure-boot=T
Unable to change the encryption mode and policy. Verify that the current host configuration can satisfy the new requirement.
[root@esxi:~]
```

コマンドの前半では、セキュアブートに移行できるかのチェックではOKということですが、実際のセキュアブートへの変更ではエラーとなってしまいます。VMware Communityでも見かける内容ですが明確な答えは無いようです。これはマザーボードとESXiとの相性と考えられますが、今後もウォッチしていきたいと思います。

> <https://communities.vmware.com/t5/ESXi-Discussions/Enabling-Secure-Boot-not-possible/m-p/2864968>

### インストール

これまで同様、Rufusで32GBのUSBメモリにISOファイルを登録しUSBブートからセットアップしています。64Gbyteのメモリを認識し、NICも4つ認識されました。

{% asset_img esxi1.png 800 alt %}

NICの情報はこちらです。

{% asset_img esxi2.png 800 alt %}

ipolexはさらに製造をアウトソースしているのでしょうか、単に販売代理店でしょうか。MACアドレスを見る限りでは、「Beijing Sinead Technology」が製造しているようです。購入にあたってはipolexのサポートの方と色々やりとりができましたので安心して購入できました。

ストレージコントローラは以下の通りです。NVMe 1GBに加え、バックアップ用途で500GBのSSDを加えています。

{% asset_img esxi3.png 800 alt %}

### 旧マシンからvmの移行

環境が異なるため、vSwitchやポートグループの設定はやり直しになりました。NASに対するNFSのマウントなど、いくつかの作業はありますが、そう重い作業ではありません。旧マシンでghettoVCBのバックアップから新環境にレストア、こちらも特段問題がなく3つのvmはあっさり30分程度で終了です。セキュアブートにしていたubuntuやWin10などは問題なく起動しています。


## ストレージのパフォーマンス

vmのWindows10で実行したCrystal Disk Markの結果です。

{% asset_img DiskMark.png 480 alt %}

## ネットワークのパフォーマンス

こちらはWindows10Proのvmから10GbEのNASに対するiperf3の結果です。シングルスレッドだと7Gbps程度が限界のようです。元々、Windows版のiperf3はUNIXからの移植のためのヘルパー機能であるランタイムライブラリ「Cygwin1.dll」を使っておりパフォーマンスが出づらい状況にあります。さらに対向する端末の能力が高くないとこのような結果になりやすいです。10並列でようやく期待値となりました。

- シングルスレッド

```
C:\Users>iperf3 -c 192.168.x.x
[ ID] Interval           Transfer     Bandwidth
[  4]   0.00-10.00  sec  8.48 GBytes  7.29 Gbits/sec                  sender
[  4]   0.00-10.00  sec  8.48 GBytes  7.29 Gbits/sec                  receiver
```

- 10スレッド

```
C:\Users>iperf3 -c 192.168.x.x -P10
[ ID] Interval           Transfer     Bandwidth
(省略)
[SUM]   0.00-10.00  sec  10.9 GBytes  9.33 Gbits/sec                  sender
[SUM]   0.00-10.00  sec  10.8 GBytes  9.28 Gbits/sec                  receiver
```

ubuntu20は問題なしです。

```

user@ubuntu1:~$ iperf3 -c 192.168.x.x

Connecting to host 192.168.x.x, port 5201
[  5] local 192.168.x.x port 55808 connected to 192.168.x.x port 5201
[ ID] Interval           Transfer     Bitrate         Retr  Cwnd
[  5]   0.00-1.00   sec  1.09 GBytes  9.39 Gbits/sec    0   1.69 MBytes
[  5]   1.00-2.00   sec  1.07 GBytes  9.20 Gbits/sec    0   1.69 MBytes
[  5]   2.00-3.00   sec  1.10 GBytes  9.42 Gbits/sec    0   1.69 MBytes
[  5]   3.00-4.00   sec  1.09 GBytes  9.40 Gbits/sec    0   2.10 MBytes
[  5]   4.00-5.00   sec  1.10 GBytes  9.42 Gbits/sec    0   2.21 MBytes
[  5]   5.00-6.00   sec  1.09 GBytes  9.40 Gbits/sec  696   1.75 MBytes
[  5]   6.00-7.00   sec  1.09 GBytes  9.41 Gbits/sec    0   1.75 MBytes
[  5]   7.00-8.00   sec  1.10 GBytes  9.42 Gbits/sec    0   1.75 MBytes
[  5]   8.00-9.00   sec  1.10 GBytes  9.42 Gbits/sec    0   1.75 MBytes
[  5]   9.00-10.00  sec  1.06 GBytes  9.10 Gbits/sec    0   2.22 MBytes
- - - - - - - - - - - - - - - - - - - - - - - - -
[ ID] Interval           Transfer     Bitrate         Retr
[  5]   0.00-10.00  sec  10.9 GBytes  9.36 Gbits/sec  696             sender
[  5]   0.00-10.00  sec  10.9 GBytes  9.34 Gbits/sec                  receiver

iperf Done.

```

速度としては問題ありませんが、ubuntu側にRetrの数字が出ており、対向側端末の能力不足で送信側のTCPの再送が稀に入っています。

## 電力チェック

簡単な負荷テストを実施してみました。このESXi上にある仮想マシン2つを使ったテストです。ubuntu(2vCPU)からfast.comへの速度テストとSophos Firewall(4vCPU)でIPSによるSSL/TLSインスペクションの負荷試験です。回線契約はauひかりの5Gbpsですが、FirewallのSSL/TLSインスペクションが入るのでスループットは落ちます。CPUリソースおよび電力の記録は以下の通りです。

{% asset_img fastcom.png 400 alt %}

{% asset_img esxi4.png 1024 alt %}

{% asset_img wchecker.png 400 alt %}

CPU使用率は綺麗に分散していますしまだ半分ほど余力があります。Sophos FirewallのIPSは4つのスレッドで動作すると聞いていたことがあったので、1つのスレッド（vCPU）に偏るか最大4つのスレッドに偏るかと思いましたが、良い意味で予想は外れました。電力については、何もしていない時で35W、速度テスト実施中でも100Wに到達しない程度です。

ちなみに、数分速度テストを実施した後のダイレクトアタッチケーブルのSFP+モジュール部分は冷たく感じる程度で全く熱を持っていませんでした。

## SFP+について

今回、SFP+の4PortのNICを選択しましたが、インターネット接続側のホームゲートウェイ（HGW)は従来のRJ-45の端子であることが殆どです。この場合は以下の選択肢があります。
1. 拡張性のあるマザーボードを選定し、2つのPCIeスロットに2枚のネットワークカードを挿す（1つはRJ45、1つはSFP＋）
2. RJ45ポートとSFP＋ポートを持つスイッチングハブを経由し、ESXiからスイッチにはSFP＋で接続、スイッチからHGWにはRJ45で接続する。この場合はスイッチにおけるLAN側、WAN側とをVLANでネットワークセグメントを分離する必要があります（私はこの方法を選択）。
3. SFP＋からRJ45への変換専用の小さなスイッチを用意する（CRS305-1G-4S+IN)。但し、この場合もRJ45変換のSFP＋トランシーバーは必要です。HGWが2.5GbpsのRJ45タイプであればQNAPの小さいスイッチも合うでしょうか。
 - MikroTik
 <https://mikrotik.com/product/crs305_1g_4s_in>
 - QNAP
 <https://www.qnap.com/ja-jp/product/qsw-2104-2s>

お勧めしないのは、NICのSFP＋ポートにRJ45変換のための10Gトランシーバーを接続することです。10GのRJ45トランシーバーは3W程度の消費電力ではありますが、触れなくなるほど高熱（70℃）になり、NICに接続するのはNIC破損の危険が高いです。
スイッチに10Gトランシーバーを接続する場合、ネットワーク機器を販売しているMicroTikでは以下のガイダンスを提示しています。

> MikroTik S+RJ10 general guidance
 前述の通り、S+RJ10(10Gbps RJ45トランシーバー)は通常のトランシーバーよりも発熱が大きく、特にリニアSFPケージを4つ持つデバイスでは、並べて置くとオーバーヒートにつながる可能性があります。S+RJ10は2個おきに配置し、その間に光トランシーバーか空きポートを確保することをお勧めします。

 <https://wiki.mikrotik.com/wiki/S%2BRJ10_general_guidance>

MikroTikのS+RJ10は高発熱で有名なモジュールですが、他の10GBase-T SFP+モジュールも相当な温度になります。トランシーバーの作りに問題があるわけではなく、そもそも10GBase-T（RJ-45）はかなりの発熱になってしまい、スイッチングハブであっても内部は相当な熱を持ちます。

## 補足

省電力化と発熱対策の目標は達成しましたが、NICの価格は高止まりしていて、買うタイミングとしては躊躇してしまうところです。3年半前と1年半前にそれぞれ3万円程度で購入したX550-T2が今は5万円以上しています。Ryzen5700Gが45,000円でStarTech.comのOEM版X550-T2相当が45,800円で値段が同程度になっているのは驚きです。（共にAmazon価格）

Mellanoxの現行モデルはやはり在庫を殆ど見かけない状況ですが、古いMellanoxのConnect X-3(MCX311A-XCAT)は安価で手に入ります（ebayなどでは5,000円程度です）。私はMellanoxのConnect X-3(PCIe3 x 4)を保有しており、Windows10とQNAPのNAS（TVS-473e）で動いています。Connect X-3は2019年10月に既に販売終了しています。5年後のサービス終了までは保守されるようですが、最近のドライバなどは見かけません。また新しいOSでは対応が見送られる可能性があります。ただ、半導体不足の今の時期のつなぎとして割り切る考え方もありだと思います。Nvidia（Mellanox）のサイトではESXi7.0のドライバはConnect X-4を対象にしているようですが、セキュアブートのESXi 7.0U3cではインストール時にドライバ追加無しでNICのリンクアップ、疎通確認はできています。動作確認についてはESXiにログインしたまでで、仮想マシンを作成して動作まではさせていません。あくまでご参考です。

{% asset_img mellanox.png 1024 alt %}

> Mellanox End of Life Notification Procedure
 <https://network.nvidia.com/related-docs/eol/LCR-000532.pdf>

## intel X710の注意点について

X710は省電力で安定した動作をしますが、過去に何度もファームウェアの脆弱性が指摘されています。今の半導体不足の外部環境下において、もはやintel純正を購入することは困難ですが、サードパーティ製のNICでX710のチップが乗ったものを購入する場合であっても、ファームウェアの更新が必要になってきます。ESXiにおけるネットワークカードのファームウェアの更新方法も整理していますので、以下の記事を参照してください。

- {% post_link nic-firmware %}
