---
title: Sophos Firewallのメイン画面と特徴について
date: 2020-03-08 20:56:35
tags:
  - XG Firewall
categories:
  - Security
---
<p class="onepoint">この記事で実現すること</p>
Sophos Firewallの管理画面とメニューから、製品の持つ機能を説明します。

<!-- more -->
## XGのメインページ

 XGの管理画面にログインすると、Controle Centerが表示されます。ここでは今の全体のFirewallの状況が示されます。ホームユーザーには相当なボリュームの内容で圧巻です。ホームユーザー向けに一部機能は制限されているので、不要な項目もたくさんありますが、Home Editionとして必要なものを見ていく事にしましょう。

{% asset_img main1.png alt %}

- 左上のシステムのアイコンは通常緑色です。
- ネットワーク攻撃やブロックされたアプリなどが画面中央に赤色で表示されます。

左ペインを見ていきます。

| 項目             | 内容                                                                                 |
| ---------------- | ------------------------------------------------------------------------------------ |
| ルールとポリシー | Firewallのルールを決める一番重要なメニューです                                       |
| web              | コンテンツの種類によってアクセス制御を行うメニューです                               |
| ネットワーク     | インストール後、ネットワークの変更を行う時に、それなりに頻度の高いメニューになります |
| 認証             | VPNを使う時にワンタイムパスワードを併用する際利用します                              |
| ホストとサービス | 自分のFW配下にあるクライアントを登録する時に使用します                               |
| 管理             | このFirewallのデバイスの管理を行います                                               |

右上のログビューアをクリックすると別画面でFirewallのログがポップアップします。

## Sophos Firewallのアーキテクチャ

Sophos Firewallの最も重要な機能はv18から採用されている{% label primary@XStreamアーキテクチャ %}です。暗号化されたhttpsプロトコルの様々なアプリケーションやコンテンツの中身を高速かつ適切に精査し、脅威から保護、かつ高速に動作する仕組みとなっています。

以下、Sophosのサイトから引用します。

{% cq %}

XG Firewallの全く新しいXstreamアーキテクチャは、きわめて高いレベルの可視性、保護、およびパフォーマンスを提供します

{% endcq %}

>**TLS インスペクション**
>TLS 1.3 をサポートするネットワーク上の全ての暗号化されたトラフィックに業界をリードするパフォーマンスと可視性を提供

>**Xstream  DPI エンジン**
>単一のストリーミングエンジンで高性能なディープパケット保護を実現し、既知および未知の脅威をすべて阻止

>**Xstream  Network Flow FastPath**
>信頼性が高く重要なクラウド、SaaS、VoIP アプリケーショントラフィックを高速化して、最適なパフォーマンスを実現

今回の構築する環境で実際に計測したSpeedtest.netの速度チェックのキャプチャ画像です。

{% asset_img speedtest.png alt %}

環境は以下の通りです。

- ネット回線： auひかり5Gbps
- XGのマシンスペック： Core i7メモリ16Gbyte
- 仮想環境： ESXi6.7
- ネットワークカード： intel X550-T2
- クライアントPC： CeleronG3900という3年前の一般的なクライアントに5GbpsのNIC(Aquantia AQtion 5G Network Adapter)を組み込んだもの

{% note warning %}

XG Home Editionは6Gbyteメモリ上限となる制約があります

{% endnote %}

クライアント側のCPUで頭打ちになっており、XGは素晴らしい性能を持っています（もちろん業務向けとしては単一のセッションだけで評価は出来ませんが）。v17まではほぼProxyサーバとしての動作でしたが、v18はPort443に限らず、httpsの流れるデータをリアルタイムで精査します。私は製品のベータ版である、アーリーアクセスプログラムに参加していましたが、テストの最終局面でスピードが劇的に改善した時は感動しました。ホームユーザーが業務向けの製品を使えるのは本当に素晴らしい事です。
