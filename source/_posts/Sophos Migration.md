---
title: Sophos FirewallをESXiからProxmoxに移行
date: 2026-05-16T10:37:13+09:00
tags: proxmox
categories:
---


{% asset_img Title.png alt %}

<p class="onepoint">この記事で実現すること</p>

これまで使ってきたESXiからいよいよProxmoxに移行します。私の環境で最も大切なVMはSophos Firewallですが、移行の過程、チューニングした項目を記録に残します。

<!-- more -->

## Proxmox VEについて

前回、Proxmoxの紹介をしてから2年が経過しました。基本的なProxmoxのセットアップは以前からほとんど変わっていませんので以下のものを参照してください。vmの作り方についてもほぼ変わっていません。今の最新はv9.1.9です。

- {% post_link ProxmoxVE %}

## Sophos Firewallについて

Sophos Firewallの最新はv22.0.1 MR-1-Build490です。非常に安定しており、SSl/TLSインスペクションで脅威の対策をすることにおいてはホームユーザーとしては唯一無二のプロダクトだと考えてます。

## 移行のきっかけ

ESXi vSphere hypervisorですが、すでに個人向けにはパッチが提供されなくなったようです。昨年の4月から定期的に状況を確認していましたが、vmxnet3の脆弱性が発表されてからも動きがないので、いよいよProxmoxに移行することとしました。移行するならばESXiでできなかったクラスタ化にも取り組んでみたいと考えてます。

## Sophosの移行方法

ESXiのストレージをproxmoxでマウントしてマイグレーションするという方法が多くのサイトで説明されています。ただし、ESXi稼働時代にはVMware ToolsがSophosに自動でインストールされていました。Ubuntuであればパッケージをremoveしてから移行ということも考えられますが、この辺りの影響がFirewallという目的を鑑みると一抹の不安があり、ちょっと遠回りですが、正攻法でSophosの機能を使って移行することにしました。

私の自宅のネットワーク構成は以下の通りです。現状に影響を与えず、セットアップを行なっていきます。

{% mermaid flowchart TD %}
  
    A[ESXi上の旧Sophos稼働中] --> B[Proxmox上に新Sophosを構築]
    B --> C[6 NIC構成を作成<br/>Port1〜Port6]
    C --> D[Sophosバックアップを取得]
    D --> E[新Sophosへリストア]
    E --> F[MAC / Port認識を確認]
    F --> G[テストLANで管理GUI接続確認]
    G --> H[ESXi旧Sophosを停止]
    H --> I[Proxmox新Sophosを本番ネットワークへ接続]
    I --> J[Windows Clientから疎通確認]
    J --> K[Guest / Family / Server / WAN確認]
    K --> L[移行完了]
{% endmermaid %}

VLANが６つあります。NICはこれまで同様、X710の4Portを利用しており、FamilyにGuestとEdge(プリンターや無線TVなど）がタグ付きで流れてきます。
最初のセットアップはproxmoxのコンソールで実施できます。その際には、最低でもNICが２つなければセットアップができません。新規にFirewallをセットアップし、VLANを新旧で揃え、旧Firewallのバックアップから新Firewallへ戻すというのが計画になります。

## Proxmoxの設定

このように、nic0-nic3まではvmbr0ーvmbr3と相対するブリッジが存在しますのでセグメント毎に作成します。また、タグ付きでスイッチから流れてくるものはタグの指定をしておきます。

 {% asset_img pve1.png 800 alt %}

私は事前に旧FirewallのPort1〜Port6までがどのVLANかを事前に確認し、メモをとっておきました。これがズレると後で違うセグメントに異なるネットワークアドレスのパケットが流れたりして家中が大混乱になりそうと思ったからです。でも実はここまで厳格にやらなくても後で新旧で対応を変えられることがわかったのでここまでは不要だったかもしれません。

| Sophos Network on ESXi | Segment | Proxmox　Bgidge | Tag | mac Address       |
| ---------------------- | ------- | --------------- | --- | ----------------- |
| Port1                  | LAN     | vmbr0           |     | BC:24:11:xx:xx:93 |
| Port2                  | WAN     | vmbr3           |     | BC:24:11:xx:xx:7D |
| Port3                  | Family  | vmbr 1          |     | BC:24:11:xx:xx:8F |
| Port4                  | Server  | vmbr2           |     | BC:24:11:xx:xx:A3 |
| Port5                  | Guest   | vmbr 1          | 210 | BC:24:11:xx:xx:25 |
| Port6                  | Edge    | vmbr 1          | 130 | BC:24:11:xx:xx:D8 |


## Sophos Firewallのインストール

このブログで何度もSophosについては書いていますし、セットアップ自体は昔から変わっていません。今回の留意事項だけ記載しておきます。

Sophosのセットアップは今も変わらずUEFIには対応しておらず、SeaBIOSを選択してセットアップします。インストールはproxmox上のターミナルからまずは最低限のLAN、WAN(DHCP)の指定をし、ネットワークアドレスの設定など従来から変わらずTerminalからのセットアップ開始になります。その後モジュールがインストールされ、GUIでのセットアップに移行します。この時に一度リブートすることになりますが、旧環境と同じ環境でセットアップしたいため、LANについてはテスト用の専用VLANを作成し、そこにWindows端末を配置してセットアップをします。WANにはそのまま接続できるようにしてセットアップ中にInternetに接続できる状態にしておきます。
その他のVLANは全て作成しますが、Proxmox上で切断状態にしてパケットが流れないようにしておきます。

### 再起動後GUIのセットアップ

以下の画面のように進めていきます。移行用VLAN上に配置した端末からFirewallに接続してID・パスワードを入力して進みましたが、後で見直したらここで元の環境から環境を戻せそうです。セットアップ中は全然気づきませんでした。ちょっと遠回りしてしまいました。
{% asset_img Sophos1.png 800 alt %}

セキュアストレージマスターキーは後でレストアしてしまうので仮のもので構いません。慎重な方は現行で設定しているものを入力してください。

{% asset_img Sophos2.png 800 alt %}

{% asset_img Sophos3.png 800 alt %}
{% asset_img Sophos4.png 800 alt %}

ファイアウォールのライセンスは現在使っているIDをそのまま登録します。

{% asset_img Sophos5.png 800 alt %}
{% asset_img Sophos6.png 800 alt %}
{% asset_img Sophos7.png 800 alt %}
そしてセットアップ完了後、admin/今回指定したパスワードでログインします。
{% asset_img Sophos8.png 800 alt %}
{% asset_img Sophos9.png 800 alt %}
新Firewallのネットワークの詳細画面で実際のMACアドレスが一致しているか確認します。
{% asset_img Sophos10.png 800 alt %}

さて、私は遠回りしましたが、以下でバックアップからレストアします。

{% asset_img Sophos11.png 800 alt %}

### その後のハマりどころ

私は二要素認証を設定していましたが、戻した後のAdminのパスワードは新たにセットアップしたパスワードになっています。そして二要素認証をパスワードの後ろに6文字を続けて入力するのですが、この2要素認証は古いものを求められます。
私はここで散々詰まってしまいました。。。

### 検証

検証とはいっても、普段のルールが戻っているかどうかの確認です。現状と同じIPアドレスを保有しているので移行環境にあるLAN、DHCPで設定されたWAN以外はIPアドレスが重複してしまうので、まだこの段階ではProxmox上では切断したままです。インターネットにも無事接続できるか、仮のTest VLANに配置した端末からアクセスを行います。それが終わったら、いよいよESXi側のSophosを停止し、新Sophosも停止し、各VLANを接続した後、再度新Firewallを起動します。数年に亘り、大きなトラブルもなく稼働してくれたESXiに感謝です。

### 確認事項

Sophosのサイトには、Proxmoxでのインストールに関するドキュメントがあります。

- <https://docs.sophos.com/nsg/sophos-firewall/21.5/Help/ja-jp/webhelp/onlinehelp/VirtualAndSoftwareAppliancesHelp/KVM/ProxmoxInstall/index.html#sophos-firewall-qcow>

また、KVMに関するページでは以下の記載があります。

> ”Proxmox 上で Sophos Firewall VM を実行するには、 Proxmox の VM 設定で「QEMU ゲストエージェントを使用する」をオフにする必要があります。”

- <https://docs.sophos.com/nsg/sophos-firewall/20.0/Help/ja-jp/webhelp/onlinehelp/VirtualAndSoftwareAppliancesHelp/KVM/index.html>


### Proxmox のパラメータ

VMの構成で気をつけるとしたら、ネットデバイスの設定で、Proxmox側のファイアウォールをオフにすることでしょうか。MACアドレスのなりすましや、L3レベルのフィルタ機能ですが、Sophosで十分管理できるので外して良いです。後はメモリを固定して使いたいので最初のVMの設定画面にも載せていますが、Balooningデバイスのチェックは外しておきます。

## Proxmoxのチューニング

これは私の利用しているintel X710に限った話かもしれませんが、LAN内に速度差のある端末やAPがある場合は、フローコントロールの活用を検討してください。一般的なネットワークスイッチはフローコントロールがオンになっています。またバースト的な大量データの送受信のために、以下の項目は設定すべきでしょうか。特にRing Bufferは効果が大きいと思いますが環境によって変わるでしょうから、2048〜6144あたりで調整されることをお勧めします。


### 1. X710 Ring Buffer 拡張

確認コマンド。

```bash
ethtool -g nic0
```

初期値は RX/TX ともに 512。

X710 の最大値は RX/TX ともに 8160。

適用値。

```bash
ethtool -G nic0 rx 4096 tx 4096
ethtool -G nic1 rx 4096 tx 4096
ethtool -G nic2 rx 4096 tx 4096
ethtool -G nic3 rx 4096 tx 4096
```

永続化例。永続化は /etc/network/interfaces

```
post-up /usr/sbin/ethtool -G $IFACE rx 4096 tx 4096 || true
```

#### 理由

- 高速通信時の micro burst 耐性向上
- NIC ring overflow による drop / retry 抑制
- 最大値 8160 ではなく 4096 にすることで、遅延増加を抑えつつバースト耐性を確保

### 2. ntuple filters 無効化

確認コマンド。

```bash
ethtool -k nic0 | grep ntuple
```

初期状態。

```
ntuple-filters: on
```

適用。

```bash
ethtool -K nic0 ntuple off
ethtool -K nic1 ntuple off
ethtool -K nic2 ntuple off
ethtool -K nic3 ntuple off
```

永続化例。

```
post-up /usr/sbin/ethtool -K $IFACE ntuple off || true
```

#### 理由

X710 の Flow Director / ntuple により、特定 flow が意図せず特定 queue に偏る可能性がある。

仮想化・Firewall VM・VPN系の通信では、NIC側の自動 steering より Linux / RSS 側に任せた方が安定することがある。

### 3. Flow Control

（環境に応じて） RX/TX ともに ON。※LAN内で端末の速度差がある場合に吸収してくれます。

確認。

```bash
ethtool -a nic1
```

確認結果例。

```
Pause parameters for nic1:
Autonegotiate: off
RX: on
TX: on
```

永続化済み設定。

```
post-up /usr/sbin/ethtool -A $IFACE tx on rx on 2> /dev/null
```


### 4. offload 設定

以下は基本的に ON 維持。

- rx-checksumming
- tx-checksumming
- tcp-segmentation-offload / TSO
- generic-segmentation-offload / GSO
- generic-receive-offload / GRO
- rx-vlan-offload
- tx-vlan-offload
- receive-hashing


# Sophos VM 側設定

## 推奨設定

```
CPU: 4 core
NIC: VirtIO
Multiqueue: 4
SCSI: VirtIO SCSI single
Disk IO thread: ON
Proxmox Firewall: OFF
```

## Proxmox Firewall

Sophos VM の各 NIC では Proxmox Firewall を OFF。

確認箇所。

```
VM
→ Hardware
→ Network Device
→ Firewall OFF
```

Firewall VM の前段で Proxmox Firewall が挟まると、切り分けが複雑化するため OFF

##　まとめ

Proxmoxもこういったネットワークチューニング次第で十分に速度を出せます。

 {% asset_img speedtest.png 360 alt %}

AMD Ryzen 9 7900 (12C/24T)とAMD Ryzen 5 5600G (6C/12T)とで計測しましたが、大きく値に変化はありませんので、CPU性能よりは省電力を目指す方が良さそうです。
