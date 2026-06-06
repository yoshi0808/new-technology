---
title: Proxmox 9.2でUbuntu ServerをCloud-Init化する：公開鍵認証・Secure Boot対応テンプレートの作り方
date: 2026-06-06T12:42:38+09:00
tags: proxmox
categories:
---

{% asset_img Title.png alt %}

<p class="onepoint">この記事で実現すること</p>

仮想環境のProxmox VE9.2でCloud-Initを活用する方法をまとめています。私はこれまでは単にUbuntu Desktop VMのクローンだけで済ませており、Cloud-Initの最初の手間を考えると大して時短にもならないと考えてましたが、最近はDesktopではなくほぼUbuntu Serverに変わってきていることや小さいノードを複数持たせる傾向にあるため、改めてCloud-Initのメリットを考えてみたいと思います。

<!-- more -->

## Cloud-Initとは

ご想像通り、テンプレートを作成し、それを元にVMを構築していくためのものです。複数のLinux VMがあるとしたら共通設定される部分（ユーザー、パスワードやSSH鍵など）は、できるだけ共通化して省力化を図ろうというものです。

{% asset_img flow.png 800 alt %}

Cloud-Initが向いているのは、特にLinuxは親和性が高いのですが、似たような環境をいくつも作成するケースです。
Ubuntuだと開発、監視基盤、自動実行など目的に合わせてLinuxサーバーを構築したり、一時的なテスト端末を用意したりする場合に大きな効果を発揮します。

## なぜ使おうと思ったか

元々、Cloud-Initは特別新しいものでもなく、私自身はこれまでもVMのクローンで十分という認識があり、そもそもUbuntuのインストールも簡単にはなっているのでさほど気にしてはいませんでした。
ESXiを使っていた時代にも、そもそもUbuntuも数台あったものの、気が向いたら何かのサーバーを立てるのに使う程度のものであって、本格稼働していたとは言い難い状況でした。

何よりもESXiはVMware Remote Consoleが便利だったおかげで、WindowsやmacOSからのコピペがとても簡単でした。クライアントで必要な情報を集めて、ダウンロードしたものをアップしたり、ダウンロードリンクを纏めてubuntuに取り込み、Ubuntu側で纏めて作業するという流れで運用してました。

ESXiからProxmoxに移行してきて思ったことは、かなりLinuxライクな運用が求められることであり、またCLI中心に戻ってきたと感じたことです。もちろん、ESXiのパッチもコマンドベースでしたが、Proxmoxではかなりパッチの頻度も多く、詳細な情報を見られるようになった反面、運用面ではかなりやることが増えたなと感じます。もっとも、ESXiではブラックボックスでしたのであまり気にしなくてもよかった（色々知らない方が幸せ）と言えます。

ちょうど時代も変わってきたと感じます。世の中にはサイバー攻撃が溢れ、今やパスワード管理というのは時代遅れになってきており、二要素認証だけではなく、フィッシング耐性が求められるパスキーが一般的になりつつあります。ホームラボは今のままで無影響ということにはなりません。これまでよりもセキュリティ対策に注力する必要があります。弱いパスワードのVPN、ホームラボならではの証明書エラー、強度の低いWi-Fiパスワードなど、見直すべき箇所はたくさんあります。世の中のパブリッククラウドのセキュリティ強化の流れからは取り残されたホームユーザーのオンプレミス環境は、今まさに見直しが必要な状況になってきていると思います。そして、そのためには個々のサーバーを場当たり的に構築するのではなく、共通のルールで構築・運用できる基盤が必要になります。


### ホームラボの運用について

私個人としてはホームユーザーという立場で、データ保管やネットワークなどが中心の運用になっていると思います。NASはSynologyを使い、ネットワークはUniFiを使い、できれば既にあるものはわざわざ自分では作らないという考えであり、過去、自身で構築している主だったものとしてはESXiに乗ったFirewall（Sophos）でした。

Proxmoxになって、クラスター対応ができるようになり、運用の品質が一段上げられると感じました。前述したようにGUIである程度簡単にやれるのはとても便利でしたが、Ubuntuでも活用しているとは言い難く、なぜUbuntu Desktopなの？と聞かれればせいぜいネットワークの設定がGUIで簡単、Firewallの設定が簡単だったということくらいでしょうか。

ProxmoxはGUIを備えているとはいえ、やはり細かな作業単位はコマンドライン中心です。UniFiも見た目の良いコンソールはありますが、実際に細かく見ていくとしたらスイッチにSSHして見ていくしかありません。結局は、なんか不調だなと思ったところで、こういった漠然と手作業でやっていたことについて、品質を上げるためにはある程度の監視基盤や自動実行する基盤が必要と感じるようになりました。こうなってくると複数のVMが必要となり、ハードウェアのリソースにも限りがあります。Ubuntu Serverで最低限度のリソースで稼働できることを目指すようになりました。

{% asset_img homelab.png 1024 alt %}

### AIの活用

これをお読みの皆さんも、お忙しい中、そんなに自宅の基盤の運用に時間を掛けていられないのが実情だとは思います。しかしそれを少し変えられるのは、台頭してきたAIの活用です。監視のための細かなShellを作るなんて仕事以外ではとてもやりきれないものですが、かなりの負荷軽減が可能となってきています。AIでブラウザを操作するということもできますが、コマンドを使えば圧倒的な速度で物事が進みます。しかも再現性が高くなります。

大事なことはこれまで人がわかりやすいコマンドラインやシステム構築に重きが置かれていたものが、AIを使って生産性を高める、運用品質を高められるようになったという事です。

人の作業は曖昧で、VM1つづつ見ても、設定内容がバラバラなものが多いのではないでしょうか。ある程度のルールが決まっていた上で共通の運用基盤を作ることが何よりも品質向上に資するのではないかと思います。

## ホームラボの品質向上で目指すもの

- GUI＋手順ということではなく、コマンドベースで一定の手順で運用し、再現性が高く、確実性を求める
- 監視を強化する
- セキュリティ向上
- ダウンタイムの減少

これらを実現するために、それぞれの専門分野のVMを立てて、それ専用のプロダクトを導入することにしました。VMは目的毎に分け、余計なモジュールを入れない事を基本にします。モジュールのアップデートの頻度を少なく、脆弱性のリスクを抑制、OSのリブート頻度を減らし、安定したサービス提供を目指します。
自動実行基盤　パッチ適用、ヘルスチェック→Ansible。きちんとやるにはDev、Productionそれぞれの環境が必要にもなってきます。
監視基盤　定番のGrafana、Loki、Prometheusで監視
運行計画　Semaphore-UI GUIでAnsibleの状況や運行管理（バッチ時刻管理）
証明書管理

## 運用スタイルの変遷

上記のようなプロダクトの構築を行なっていく上では共通化された認証基盤、それこそ基本の名前解決から全て統一的に対応していくことになります。気が付けば、ターミナル（macOSのiTerm2）、定型処理を行うAnsibleの開発はVSCodeにCodex拡張機能、ClaudeCode拡張機能を用いるのがスタイルになってきました。
Ansible端末を踏み台にProxmoxに接続しコマンドを叩いて結果を収集するなど、気が付けば作業はSSHばかりです。もちろんこれは構築（開発）作業がそうなのであって、実際の運用はGUIが中心になります。

- Semaphore-UI運行管理（定期的なAnsibleジョブ実行）
 {% asset_img semaphoreui.png 1024 alt %}

- Grafana（Loki,Prometheus）(主にUniFiのネットワーク統計、Syslog管理）
 {% asset_img grafana.png 1024 alt %}

- VSCode（ClaudeCode（実装）とCodex（レビュー））
 {% asset_img vscode.png 1024 alt %}
 VSCodeはリモート上のAnsibleコードをaiで生成、レビューを実施します。

 ## Cloud-Initに必要なもの

 必要なものは簡単にいえば、クラウドイメージのUbuntu本体とユーザー設定です。


## 実際のCloud-Initの構築

＜前提＞ファイルシステムはzfsを前提に構築しています。ext4の方は別途ストレージについてはProxmoxサイトなどを参照し、適宜変更ください。

## Cloud Image

 - Proxmox（KVM）用Ubuntu26.04 Cloud image
  <https://cloud-images.ubuntu.com/resolute/current/>から、`resolute-server-cloudimg-amd64.img`をダウンロードします（QCow2 UEFI/GPT Bootable disk image）。

  Proxmoxのshellから`/var/lib/vz/template/iso`に移動し、`wget https://cloud-images.ubuntu.com/resolute/current/resolute-server-cloudimg-amd64.img`で取得します。

> 本記事では2026年6月時点のUbuntu 26.04 LTS cloud imageを利用しています。環境によってはdaily/currentの内容が更新されるため、実際に利用する際はファイル名と日付を確認してください。

``` bash
root@pve1:~1 cd /var/lib/vz/template/iso
root@pve1:/var/lib/vz/template/iso wget https://cloud-images.ubuntu.com/resolute/current/resolute-server-cloudimg-amd64.img
--2026-06-06 16:03:50--  https://cloud-images.ubuntu.com/resolute/current/resolute-server-cloudimg-amd64.img
Resolving cloud-images.ubuntu.com (cloud-images.ubuntu.com)... 185.125.190.40, 185.125.190.37, 2620:2d:4000:1::1a, ...
Connecting to cloud-images.ubuntu.com (cloud-images.ubuntu.com)|185.125.190.40|:443... connected.
HTTP request sent, awaiting response... 200 OK
Length: 858720256 (819M) [application/octet-stream]
Saving to: ‘resolute-server-cloudimg-amd64.img’

resolute-server-cloudimg-amd6 100%[==============================================>] 818.94M  36.5MB/s    in 14s

2026-06-06 16:04:04 (59.4 MB/s) - ‘resolute-server-cloudimg-amd64.img’ saved [858720256/858720256]
 ```

### user-data

さて、この内容は人それぞれですので重要な部分は一応抑えつつ、カスタマイズをしていただくことになります。サーバー運用を前提の構築です。

初めに断っておきたいことは、この設定はパスワードレスでサーバー用途として構築するものです。 Ubuntu Desktopではないですし、しかもProxmoxコンソールからパスワードでログインすらできません。その代わり、起動直後からお使いのクライアントから公開鍵認証でSSHできます。

- ユーザーの作成（sudo NOPASSWD付き）
- SSH公開鍵複数の登録
- パスワード認証の無効化（`ssh_pwauth: false`）
- rootログインの無効化（`disable_root: true`）
- SSH hardening（`/etc/ssh/sshd_config.d/99-hardening.conf`）
- タイムゾーン（Asia/Tokyo）・ロケール（ja_JP.UTF-8）
- 初期パッケージのインストール
- unattended-upgradesの設定

まずuser-dataを配置するにあたり、Proxmoxのデータセンターからストレージ”local"に対してスニペットの配置を有効にします。編集ボタンから「スニペット」を加えます。

 {% asset_img snippets.png 1024 alt %}

user-data（Snippets）の配置場所は、`/var/lib/vz/snippets`です。

ここでは、`user-data-ubuntu-2604.yaml`という名前でuser-dataを作成します。viまたはnanoで作成してください。

``` bash
#cloud-config

# -------------------------------------------------------
# Locale / Timezone
# -------------------------------------------------------
locale: ja_JP.UTF-8
timezone: Asia/Tokyo

# -------------------------------------------------------
# User
# -------------------------------------------------------
users:
  - name: yourname
    gecos: Yourname
    groups:
      - adm
      - sudo
    shell: /bin/bash
    lock_passwd: true
    sudo: "ALL=(ALL) NOPASSWD:ALL"
    ssh_authorized_keys:
      - ssh-rsa AAAA...== cardno:14 700 491
      - ssh-rsa AAAA...== yoshi@yoshi-pc
      - ssh-ed25519 AAAA...

# -------------------------------------------------------
# SSH
# -------------------------------------------------------
ssh_pwauth: false
disable_root: true

# -------------------------------------------------------
# Packages
# -------------------------------------------------------
package_update: true
package_upgrade: true
packages:
  - openssh-server
  - qemu-guest-agent
  - curl
  - wget
  - git
  - vim
  - unattended-upgrades

# -------------------------------------------------------
# SSH hardening
# -------------------------------------------------------
write_files:
  - path: /etc/ssh/sshd_config.d/99-hardening.conf
    owner: root:root
    permissions: '0644'
    content: |
      PasswordAuthentication no
      KbdInteractiveAuthentication no
      ChallengeResponseAuthentication no
      PermitRootLogin no
      PubkeyAuthentication yes

  - path: /etc/apt/apt.conf.d/20auto-upgrades
    owner: root:root
    permissions: '0644'
    content: |
      APT::Periodic::Update-Package-Lists "1";
      APT::Periodic::Unattended-Upgrade "1";

  - path: /etc/apt/apt.conf.d/52unattended-upgrades-local
    owner: root:root
    permissions: '0644'
    content: |
      Unattended-Upgrade::Automatic-Reboot "false";

# -------------------------------------------------------
# Services
# -------------------------------------------------------
runcmd:
  - systemctl enable ssh
  - systemctl enable qemu-guest-agent
  - systemctl start qemu-guest-agent
  - systemctl enable unattended-upgrades
  - dpkg-reconfigure -f noninteractive unattended-upgrades
```

- `yourname`となっている箇所は変更してください
- 公開鍵認証は、`ssh_authorized_keys:`の場所で3つの鍵が定義されていますので、ご自身の鍵に変更してください（最低1つ必要です）。1つの鍵ごとに先頭に"-"が必要です。空白やインデントは忠実に再現してください。

### 各セクションの解説

**locale / timezone**

インストール直後から日本語ロケール・JSTタイムゾーンで起動します。指定しない場合はUTC/英語になります。

**users**

`users: - default` と書くとcloud imageのデフォルトユーザー（ubuntu）が作られます。今回はyournameユーザーだけを明示的に定義しています。ここは変更してください。

- `lock_passwd: true` → パスワードログインを無効化
- `sudo: "ALL=(ALL) NOPASSWD:ALL"` → パスワードなしでsudoを許可
- `ssh_authorized_keys` → 3つの公開鍵を登録（これはあくまで鍵を複数登録可能という意図です）

> ⚠️ GUI の Cloud-Init タブの「ユーザー名」設定（ciuser）は cicustom を使う場合は無効になります。users セクションがすべてを管理します。
> 

**ssh_pwauth / disable_root**

- `ssh_pwauth: false` → パスワード認証を無効化
- `disable_root: true` → rootログインを無効化

sshd_config.dのhardeningファイルと組み合わせることで確実に無効化されます。

**packages**

初回起動時に自動インストールするパッケージ。`qemu-guest-agent` を入れることでProxmoxのGUIにIPアドレスが表示されるようになります。これがないとIPが不明になりSSH接続先を探す手間が生じます。

**write_files**

ファイルをそのままVM内に書き込みます。

- `99-hardening.conf` → sshdの設定を強化。`ssh_pwauth: false` と合わせて二重に無効化
- `20auto-upgrades` → unattended-upgradesの自動更新を有効化
- `52unattended-upgrades-local` → 自動rebootを **false** に設定（デフォルト）。ansyのような開発VMは後でtrueに変更する

**runcmd**

初回起動時にコマンドを実行します。サービスの有効化と起動を確実に行います。`qemu-guest-agent` をstartしないとProxmox GUIにIPが表示されない場合があります。

### GUI の Cloud-Init タブとの関係

cicustomでuser-dataを指定した場合、GUIのCloud-Initタブで設定できる項目は以下に絞られます。

| 項目                    | 有効/無効                  |
| ----------------------- | -------------------------- |
| IP アドレス (ipconfig0) | ✅ 有効                     |
| DNS サーバー            | ✅ 有効                     |
| ユーザー名 (ciuser)     | ❌ 無効（user-data が優先） |
| SSH 公開鍵 (sshkeys)    | ❌ 無効（user-data が優先） |

IPとDNSはGUIで管理し、ユーザー・SSH鍵・セキュリティ設定はuser-dataで一元管理することになります。

## テンプレートVMの作成手順

以下の手順はProxmox上で実施します。ここから大事なところなので慎重に。。。
- Secure Boot
- 2コアCPU
- 2048MBメモリ

**Step 1: VM作成**

```bash
qm create 9001 \
  --name ubuntu-2604-template \
  --machine q35 \
  --bios ovmf \
  --cpu x86-64-v2-AES \
  --cores 2 \
  --memory 2048 \
  --net0 virtio,bridge=vmbr0 \
  --agent enabled=1
```

ポイント：

- `--bios ovmf` でUEFI（Secure Boot対応）
- `--machine q35` はOVMFに必須
- CPUタイプは無難に`x86-64-v2-AES`としていますが、Proxmox9.2から導入されたカスタムCPUフラグを参考にカスタムCPUを作成する場合は `custom-` プレフィックスが必要
- ネットワークはvmbr0（デフォルトVLAN）。VM作成後に用途に合わせて変更する

> カスタムCPUについては、以下の記事をご覧ください。
 {% post_link proxmox92 %}

**Step 2: EFI disk追加**

```bash
qm set 9001 --efidisk0 local-zfs:0,efitype=4m,pre-enrolled-keys=1
```

これによりdisk-0が作成される。

**Step 3: TPM追加**

Proxmox 9.xでは `tpmstate0` が正しいオプション名（`tpm0` ではない）。

```bash
qm set 9001 --tpmstate0 local-zfs:0,version=v2.0
```

これによりdisk-1が作成される。

**Step 4: cloud imageをインポート**

```bash
qm importdisk 9001 /var/lib/vz/template/iso/resolute-server-cloudimg-amd64.img local-zfs
```

インポートされたdiskは **unused0（disk-2）** として認識される。

> ⚠️ disk-0はEFI disk、disk-1はTPM用。cloud imageはdisk-2になる。Step 5で正しく指定すること。
> 

**Step 5: SCSIコントローラーとdisk設定**

```bash
qm set 9001 --scsihw virtio-scsi-single
qm set 9001 --scsi0 local-zfs:vm-9001-disk-2,discard=on,iothread=1,ssd=1
```

オプション説明：

- `discard=on`: TRIM有効
- `iothread=1`: パフォーマンス向上
- `ssd=1`: SSD emulation

**Step 6: Cloud-Init・boot・ネットワーク設定**
まずは汎用性を考え、DHCPでIP割り当てにしましょう。Diskの割り当ては念の為、数秒間隔あけて少しゆったり目で実行しましょう。

```bash
qm set 9001 --ide2 local-zfs:cloudinit
```

``` bash
qm set 9001 --boot order=scsi0
```

``` bash
qm set 9001 --ipconfig0 ip=dhcp
```

**Step 7: cicustomの設定**

```bash
qm set 9001 --cicustom "user=local:snippets/user-data-ubuntu-2604.yaml"
```

これでuser-dataをVMの初回起動時に適用するよう設定される。

**Step 8: テンプレート化**

```bash
qm template 9001
```

### 1.3 テンプレートの設定確認

```bash
qm config 9001
```

以下が含まれていることを確認する。

```
bios: ovmf
machine: q35
cpu: x86-64-v2-AES
efidisk0: ...
tpmstate0: ...
cicustom: local:snippets/user-data-ubuntu-2604.yaml
scsihw: virtio-scsi-single
scsi0: ...,discard=on,iothread=1,ssd=1
agent: enabled=1
```

### 実行ログ

``` bash
root@pve1:/var/lib/vz/snippets23 qm create 9001 \
  --name ubuntu-2604-template \
  --machine q35 \
  --bios ovmf \
  --cpu x86-64-v2-AES \
  --cores 2 \
  --memory 2048 \
  --net0 virtio,bridge=vmbr0 \
  --agent enabled=1
root@pve1:/var/lib/vz/snippets24 qm set 9001 --efidisk0 local-zfs:0,efitype=4m,pre-enrolled-keys=1
update VM 9001: -efidisk0 local-zfs:0,efitype=4m,pre-enrolled-keys=1
transferred 0.0 B of 528.0 KiB (0.00%)
transferred 528.0 KiB of 528.0 KiB (100.00%)
transferred 528.0 KiB of 528.0 KiB (100.00%)
INFO: reading raw edk2 varstore from /usr/share/pve-edk2-firmware//OVMF_VARS_4M.ms.fd
INFO: var store range: 0x64 -> 0x40000
efidisk0: successfully created disk 'local-zfs:vm-9001-disk-0,efitype=4m,ms-cert=2023k,pre-enrolled-keys=1,size=1M'
root@pve1:/var/lib/vz/snippets25 qm set 9001 --tpmstate0 local-zfs:0,version=v2.0
update VM 9001: -tpmstate0 local-zfs:0,version=v2.0
tpmstate0: successfully created disk 'local-zfs:vm-9001-disk-1,size=4M,version=v2.0'
root@pve1:/var/lib/vz/snippets26 qm importdisk 9001 /var/lib/vz/template/iso/resolute-server-cloudimg-amd64.img local-zfs
importing disk '/var/lib/vz/template/iso/resolute-server-cloudimg-amd64.img' to VM 9001 ...
transferred 0.0 B of 3.5 GiB (0.00%)
transferred 35.8 MiB of 3.5 GiB (1.00%)
transferred 71.7 MiB of 3.5 GiB (2.00%)
transferred 107.5 MiB of 3.5 GiB (3.00%)
transferred 143.7 MiB of 3.5 GiB (4.01%)
transferred 179.6 MiB of 3.5 GiB (5.01%)
transferred 215.4 MiB of 3.5 GiB (6.01%)
transferred 251.6 MiB of 3.5 GiB (7.02%)
transferred 287.4 MiB of 3.5 GiB (8.02%)
transferred 323.3 MiB of 3.5 GiB (9.02%)
transferred 359.1 MiB of 3.5 GiB (10.02%)
transferred 395.0 MiB of 3.5 GiB (11.02%)
transferred 430.8 MiB of 3.5 GiB (12.02%)
transferred 466.6 MiB of 3.5 GiB (13.02%)
transferred 502.5 MiB of 3.5 GiB (14.02%)
transferred 538.3 MiB of 3.5 GiB (15.02%)
transferred 574.2 MiB of 3.5 GiB (16.02%)
transferred 610.0 MiB of 3.5 GiB (17.02%)
transferred 645.8 MiB of 3.5 GiB (18.02%)
transferred 681.7 MiB of 3.5 GiB (19.02%)
transferred 717.5 MiB of 3.5 GiB (20.02%)
transferred 753.4 MiB of 3.5 GiB (21.02%)
transferred 789.2 MiB of 3.5 GiB (22.02%)
transferred 825.0 MiB of 3.5 GiB (23.02%)
transferred 860.9 MiB of 3.5 GiB (24.02%)
transferred 896.7 MiB of 3.5 GiB (25.02%)
transferred 932.9 MiB of 3.5 GiB (26.03%)
transferred 968.8 MiB of 3.5 GiB (27.03%)
transferred 1004.6 MiB of 3.5 GiB (28.03%)
transferred 1.0 GiB of 3.5 GiB (29.03%)
transferred 1.1 GiB of 3.5 GiB (30.03%)
transferred 1.1 GiB of 3.5 GiB (31.03%)
transferred 1.1 GiB of 3.5 GiB (32.03%)
transferred 1.2 GiB of 3.5 GiB (33.03%)
transferred 1.2 GiB of 3.5 GiB (34.03%)
transferred 1.2 GiB of 3.5 GiB (35.03%)
transferred 1.3 GiB of 3.5 GiB (36.03%)
transferred 1.3 GiB of 3.5 GiB (37.03%)
transferred 1.3 GiB of 3.5 GiB (38.03%)
transferred 1.4 GiB of 3.5 GiB (39.03%)
transferred 1.4 GiB of 3.5 GiB (40.03%)
transferred 1.4 GiB of 3.5 GiB (41.03%)
transferred 1.5 GiB of 3.5 GiB (42.03%)
transferred 1.5 GiB of 3.5 GiB (43.03%)
transferred 1.5 GiB of 3.5 GiB (44.03%)
transferred 1.6 GiB of 3.5 GiB (45.04%)
transferred 1.6 GiB of 3.5 GiB (46.04%)
transferred 1.6 GiB of 3.5 GiB (47.04%)
transferred 1.7 GiB of 3.5 GiB (48.04%)
transferred 1.7 GiB of 3.5 GiB (49.04%)
transferred 1.8 GiB of 3.5 GiB (50.04%)
transferred 1.8 GiB of 3.5 GiB (51.04%)
transferred 1.8 GiB of 3.5 GiB (52.04%)
transferred 1.9 GiB of 3.5 GiB (53.04%)
transferred 1.9 GiB of 3.5 GiB (54.04%)
transferred 1.9 GiB of 3.5 GiB (55.04%)
transferred 2.0 GiB of 3.5 GiB (56.04%)
transferred 2.0 GiB of 3.5 GiB (57.04%)
transferred 2.0 GiB of 3.5 GiB (58.04%)
transferred 2.1 GiB of 3.5 GiB (59.04%)
transferred 2.1 GiB of 3.5 GiB (60.04%)
transferred 2.1 GiB of 3.5 GiB (61.04%)
transferred 2.2 GiB of 3.5 GiB (62.04%)
transferred 2.2 GiB of 3.5 GiB (63.04%)
transferred 2.2 GiB of 3.5 GiB (64.05%)
transferred 2.3 GiB of 3.5 GiB (65.05%)
transferred 2.3 GiB of 3.5 GiB (66.05%)
transferred 2.3 GiB of 3.5 GiB (67.05%)
transferred 2.4 GiB of 3.5 GiB (68.05%)
transferred 2.4 GiB of 3.5 GiB (69.05%)
transferred 2.5 GiB of 3.5 GiB (70.05%)
transferred 2.5 GiB of 3.5 GiB (71.05%)
transferred 2.5 GiB of 3.5 GiB (72.05%)
transferred 2.6 GiB of 3.5 GiB (73.05%)
transferred 2.6 GiB of 3.5 GiB (74.05%)
transferred 2.6 GiB of 3.5 GiB (75.05%)
transferred 2.7 GiB of 3.5 GiB (76.05%)
transferred 2.7 GiB of 3.5 GiB (77.05%)
transferred 2.7 GiB of 3.5 GiB (78.06%)
transferred 2.8 GiB of 3.5 GiB (79.06%)
transferred 2.8 GiB of 3.5 GiB (80.06%)
transferred 2.8 GiB of 3.5 GiB (81.06%)
transferred 2.9 GiB of 3.5 GiB (82.06%)
transferred 2.9 GiB of 3.5 GiB (83.06%)
transferred 2.9 GiB of 3.5 GiB (84.06%)
transferred 3.0 GiB of 3.5 GiB (85.07%)
transferred 3.0 GiB of 3.5 GiB (86.07%)
transferred 3.0 GiB of 3.5 GiB (87.07%)
transferred 3.1 GiB of 3.5 GiB (88.07%)
transferred 3.1 GiB of 3.5 GiB (89.07%)
transferred 3.2 GiB of 3.5 GiB (90.07%)
transferred 3.2 GiB of 3.5 GiB (91.07%)
transferred 3.2 GiB of 3.5 GiB (92.07%)
transferred 3.3 GiB of 3.5 GiB (93.07%)
transferred 3.3 GiB of 3.5 GiB (94.07%)
transferred 3.3 GiB of 3.5 GiB (95.07%)
transferred 3.4 GiB of 3.5 GiB (96.07%)
transferred 3.4 GiB of 3.5 GiB (97.07%)
transferred 3.4 GiB of 3.5 GiB (98.07%)
transferred 3.5 GiB of 3.5 GiB (99.07%)
transferred 3.5 GiB of 3.5 GiB (100.00%)
transferred 3.5 GiB of 3.5 GiB (100.00%)
unused0: successfully imported disk 'local-zfs:vm-9001-disk-2'
root@pve1:/var/lib/vz/snippets27 qm set 9001 --scsihw virtio-scsi-single
update VM 9001: -scsihw virtio-scsi-single
root@pve1:/var/lib/vz/snippets28 qm set 9001 --scsi0 local-zfs:vm-9001-disk-2,discard=on,iothread=1,ssd=1
update VM 9001: -scsi0 local-zfs:vm-9001-disk-2,discard=on,iothread=1,ssd=1
root@pve1:/var/lib/vz/snippets29 qm set 9001 --ide2 local-zfs:cloudinit
update VM 9001: -ide2 local-zfs:cloudinit
ide2: successfully created disk 'local-zfs:vm-9001-cloudinit,media=cdrom'
generating cloud-init ISO
root@pve1:/var/lib/vz/snippets30 qm set 9001 --boot order=scsi0
update VM 9001: -boot order=scsi0
root@pve1:/var/lib/vz/snippets31 qm set 9001 --ipconfig0 ip=dhcp
update VM 9001: -ipconfig0 ip=dhcp
root@pve1:/var/lib/vz/snippets32 qm set 9001 --cicustom "user=local:snippets/user-data-ubuntu-2604.yaml"
update VM 9001: -cicustom user=local:snippets/user-data-ubuntu-2604.yaml
root@pve1:/var/lib/vz/snippets33 qm template 9001
root@pve1:/var/lib/vz/snippets34 qm config 9001
agent: enabled=1
bios: ovmf
boot: order=scsi0
cicustom: user=local:snippets/user-data-ubuntu-2604.yaml
cores: 2
cpu: x86-64-v2-AES
efidisk0: local-zfs:base-9001-disk-0,efitype=4m,ms-cert=2023k,pre-enrolled-keys=1,size=1M
ide2: local-zfs:vm-9001-cloudinit,media=cdrom
ipconfig0: ip=dhcp
machine: q35
memory: 2048
meta: creation-qemu=11.0.0,ctime=1780733774
name: ubuntu-2604-template
net0: virtio=BC:24:11:C2:29:00,bridge=vmbr0
scsi0: local-zfs:base-9001-disk-2,discard=on,iothread=1,size=3584M,ssd=1
scsihw: virtio-scsi-single
smbios1: uuid=0983fbde-74b1-452b-b64e-4c4d38704b02
template: 1
tpmstate0: local-zfs:base-9001-disk-1,size=4M,version=v2.0
vmgenid: 19c0d2da-4008-4e5a-8ee3-5b9adf2a5fdc
```

これでテンプレートが完成しています。GUIからも確認できますよ！

 {% asset_img template.png 1024 alt %}

一旦はここで区切りです。もちろん、次の稼働確認を終えるまで安心できませんが。

## VMのclone手順

ここから先はVMを作成する度にカスタマイズしながら構成します。ここからが日々の運用フェーズです。

### 2.1 Full Cloneで作成

Proxmox GUIでテンプレート（VMID 9001）を右クリック →「クローン」。

**必ずFull Cloneを選択する。** Linked Cloneはテンプレートのdiskに依存した状態になるため不可。

設定例：

| 項目       | 値          |
| ---------- | ----------- |
| Mode       | Full Clone  |
| VM ID      | 103（暫定） |
| Name       | your-vm     |
| ストレージ | local-zfs   |

 {% asset_img clone.png 640 alt %}

⚠️ ストレージをうっかりNFSにしてしまったりしないように。

### 2.2 ディスクリサイズ

cloud imageのデフォルトは3.5GBと小さいため、cloneした後に必ず拡張する。

GUIのハードウェアタブでscsi0を選択 →「ディスクアクション」→「リサイズ」で追加サイズを指定。

 {% asset_img storage1.png 640 alt %}

> ⚠️ ディスクは拡張のみ可能です。縮小はできません。拡張の対象は作成したVMです。テンプレートではないですよ！

 {% asset_img storage2.png 320 alt %}

### 2.3 IPの設定（起動前に必ず実施）

**Cloud-Initは基本的に初回起動時に適用されます。後から再適用する場合は、VM内で cloud-init clean を実行して再起動する必要があります。**

GUIのCloud-Initタブで設定するか、コマンドで：

```bash
qm set 103 --ipconfig0 ip=192.168.x.16/24,gw=192.168.x.1
qm set 103 --nameserver 192.168.x.100
```

 {% asset_img network1.png 1024 alt %}

ここはGUIの方が簡単かもしれませんね。ただし、同じVMを量産する場合はコマンドが良いでしょうね。

⚠️ 設定変更後は、必ず「イメージ再作成」ボタンをクリックします。これ忘れがちです。


## VM起動

これまでの設定の他、必要に応じてCPUやメモリも変更してください（後からでも変更できます）。

DHCPのままでよければそのまま起動してください。VM起動後、1分程度でIPアドレスがサマリーに表示されます。表示されない場合は、、、なんとかDHCPサーバーなどで確認いただき、まずはssh username@IPアドレスで公開鍵認証で接続して確認してください。スニペットが正しくないとうまくIPアドレスも取得できておらずログインできない可能性があります。

うまくいけば、公開鍵認証であっさりと接続できます。
``` bash
$ ssh yoshi@192.168.x.x
The authenticity of host '192.168.x.x (192.168.x.xxx)' can't be established.
ED25519 key fingerprint is: SHA256:3IIWwGbmYYERfk3bUl3e+YNXKtfkM+uWwBNgzRx4GFc
This key is not known by any other names.
Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
Warning: Permanently added '192.168.x.xxx' (ED25519) to the list of known hosts.
Welcome to Ubuntu 26.04 LTS (GNU/Linux 7.0.0-15-generic x86_64)

 * Documentation:  https://docs.ubuntu.com
 * Management:     https://landscape.canonical.com
 * Support:        https://ubuntu.com/pro

 System information as of 2026年 6月  6日 土曜日 18:44:34 JST

  System load:  0.09              Processes:             134
  Usage of /:   7.1% of 38.13GB   Users logged in:       0
  Memory usage: 20%               IPv4 address for eth0: 192.168.x.xxx
  Swap usage:   0%

Expanded Security Maintenance for Applications is not enabled.

0 updates can be applied immediately.

Enable ESM Apps to receive additional future security updates.
See https://ubuntu.com/esm or run: sudo pro status


*** System restart required ***

The programs included with the Ubuntu system are free software;
the exact distribution terms for each program are described in the
individual files in /usr/share/doc/*/copyright.

Ubuntu comes with ABSOLUTELY NO WARRANTY, to the extent permitted by
applicable law.
```
内部でupdateが進んでいるので、最初はrestart requiredが表示されると思います。一旦作成してしまえばDiskやCPUを変えながらさまざまなホストを作成できます。

### その後の初期設定など

#### ホスト名変更

cloud-imageのデフォルトhostnameはubuntuになります。vmにログインしたらホスト名を変更します。

``` bash
sudo hostnamectl set-hostname myhost
```
一旦SSHを抜けて入り直して確認します。

``` bash
yoshi@myhost:~$ hostname
myhost
```

> Cloud-Initでホスト名も管理できますが、本記事ではuser-dataを共通化するため、ホスト名のみ初回ログイン後に設定しています。

後は/etc/hostsなど、個人的には、他によく見直すものとしては、アップグレード時の自動リブートを有効にする設定くらいでしょうか。以下は自動リブートを有効にする設定です。

``` bash
sudo sed -i 's/Automatic-Reboot "false"/Automatic-Reboot "true"/' /etc/apt/apt.conf.d/52unattended-upgrades-local
```


### 2.4 Cloud-Init適用の順番（重要）

IPアドレスは今回、DHCPから始めましたが、本番サーバーに仕立てるにあたり、固定IPアドレスに変更する場合は、以下の手順となります。VM稼働中に実施します。この後、rebootで再起動します。

```
1. GUIのCloud-InitタブでIPやユーザー名を変更する
 IPv4アドレスは`xxx.xxx.xxx.xxx/24`とサブネットマスクビットの指定が必要です。
2. 「再生成」ボタンを押す（Cloud-InitのISOが更新される）
3. VM内で: sudo cloud-init clean
4. VM内で: sudo reboot
```

> ⚠️ 「再生成」を忘れると古い設定のままcloud-initが再実行される。GUIで変更してもVM内の設定は変わらない。

このようなIP変更は従来viやnanoでubuntuのnetplanを手修正していたことを鑑みればとても簡単です。

## まとめ

ここまで設定ができるようになれば、Ubuntuのサーバー運用はとても気軽に試すことができるようになります。使ってみれば分かりますが、Cloud-Init、とても便利です。そしてuser-dataに共通部分を加えていくことによって、VMによっての違いが少なくなり、パッチを当てたりする際などの作業が一律で行えるようになります。最終的にはVMのセキュリティを高め、品質向上に一役買うはずです。

## 補足

user-dataの配置場所は今回はローカルDiskにしましたが、クラスター化されている場合などは、NFSに配置しておくと両ノードから参照できて便利です。

``` bash
qm set 9001 --cicustom "user=local:snippets/user-data-ubuntu-2604.yaml"
```

という場所は、NFSのパス名に合わせて以下のように変更します。

``` bash
qm set 9000 --cicustom "user=Synology-nfs:snippets/user-data-ubuntu-2604.yaml"
```

