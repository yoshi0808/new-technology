---
title: ESXiでネットワークカードのファームウェアを更新する
date: 2022-04-02 08:10:04
tags: ESXi
categories:
- [Hardware]
- [Network]
---
{% asset_img title.png 1024 alt %}

<p class="onepoint">この記事で実現すること</p>

ESXiにおいてネットワークカードの主要ITベンダーであるintelおよびMellanox(NVidia)のファームウェアをアップデートします。sshでESXiホストに接続したままアップデート可能です（作業中は何度かのシステムリスタートが必要になります）。

<!-- more -->

## ネットワークカード自体の脆弱性

脆弱性対策情報データベースである、JVN iPdeiaでの検索では、2020年以降、Intel(R) Ethernet I210 Controller、Intel(R) Ethernet 700 Series Controller 、Intel(R) Ethernet Network Controller E810において脆弱性が発見されています。

- JVN iPdeia （"Intel Ethernet Controller"で検索）
 <https://jvndb.jvn.jp/search/index.php?mode=_vulnerability_search_IA_VulnSearch&lang=ja&keyword=Intel+Ethernet+Controller&useSynonym=1&vendor=&product=&datePublicFromYear=&datePublicFromMonth=&datePublicToYear=&datePublicToMonth=&dateLastPublishedFromYear=&dateLastPublishedFromMonth=&dateLastPublishedToYear=&dateLastPublishedToMonth=&cwe=&searchProductId=>

Mellanox(NVIDIA)のネットワークカードについては脆弱性は見つかっていないようです。

## ネットワークカード(NIC)の保守期限

ESXiでのドライバはintelやMellanoxを使っている限りは最適なドライバがパッチ公開のタイミングで提供されます。但し、チップを動作させるネットワークカード上のファームウェアは別途NICの提供ベンダーからのパッチを適用する必要があります。
ESXiのハードウェア互換リストでは古いネットワークカードでも対応している場合があります。しかし、ベンダー側でサポート終了（EOSL）となっている製品もあり注意が必要です。ビジネス用途でなければ使えるうちは使うといった対応が取れますが、万が一ファームウェアで脆弱性などが指摘された場合は、そのNICの利用を取りやめる必要が出てきます。

## intelのサポート終了NIC

以下のリンクではintelの製造終了のNIC一覧情報があります。さらに5年経過でサポート終了という事です。X520やX540なども製造終了しており、5年間の保証ポリシーの対象となっています。

- intel
 <https://www.intel.co.jp/content/www/jp/ja/support/articles/000026530/ethernet-products/legacy-ethernet-products.html>

しかし、X520とX540の新しいファームウェアのダウンロードについては見つかりませんでした。私の見落としでなければ、最新版のファームウェアの提示が無いというのはこれから新規導入する場合、リスクが大きく感じます。

## Melanoxのサポート終了NIC

Mellanoxにおいても"Products End-of-Life Policy"というものがあり、販売終了から5年経過し、End of Supportとなるようです。
このURLには、"Mellanox EOL'd Products file"という**Excelファイル**へのリンクがあります。
- Mellanox
 <https://network.nvidia.com/support/eol/>
 Excelが起動してきて少しびっくりしました{% emoji confused %}

最近は$50で購入できるMCX311A-XCATなどは2020年3月31日に販売終了となっています。また、Connect X-4やX-5,X-6であっても型番によっては販売終了としてリストされているので一度確認されることをお勧めします。
Mellanoxの場合はVMwareの互換リストから外れているConnect X-3についてもWebにはファームウェアの情報が掲載されているので、いつでも最新のファームウェアに更新できます。

## intelのNICファームウェア更新

intelの純正のNICであればそのカード名称でintelのサイトを検索しファームウェアを更新します。また、3rdベンダーがintelチップを採用し製造したNICだとintelのチップの名称でファームウェアをダウンロードする必要があります。「{% post_link building-setup-esxi7 %}」では、私は3rdベンダーが製造したintel X710を搭載したNICを購入したと書きましたが、このようなケースではintelが提供するファームウェアを適用可能なのか、それとも3rdベンダーが提供するファームウェアがあるのか事前に確認する必要があります。X710のSFP＋を4Portというのは低消費電力・低発熱で魅力的ですが、前述した脆弱性について既に確認していたため、ファームウェアのアップデートに言及できるベンダーのものを選定しました。販売者の中には「できるはずだがお勧めしない」という回答もありました。3rdベンダーの場合は、ファームウェアアップデートの設定ファイルの書き換えが必要な場合もあります（私の購入したNICはこの修正が不要でした）。

導入はシンプルでnvmupdateというファームウェア更新ツールとセットになったNICのファームウェアをintelのサイトからダウンロードし、ESXiにSSHで接続し実行するだけです。留意点としては、誤った種類のファームウェア適用によりNICが使えなくなってしまった場合は自己責任であり、リスクはあります。

導入手順を説明します。intelのサイトで"nvm update"を検索します。するとX550シリーズ、700シリーズ、E810シリーズとnvmupdateについて表示されるのでお使いのチップに相当するモジュールをダウンロードしてください。intel純正のカードであればカード名で検索も可能です。

- X550シリーズ
 <https://www.intel.co.jp/content/www/jp/ja/download/19362/non-volatile-memory-nvm-update-utility-for-intel-ethernet-adapters-550-series-vmware-esx.html?wapkw=nvm%20update%20esxi>

- 700シリーズ
 <https://www.intel.co.jp/content/www/jp/ja/download/18638/non-volatile-memory-nvm-update-utility-for-intel-ethernet-adapters-700-series-vmware-esx.html?wapkw=nvm%E3%80%80update>

- E810シリーズ
 <https://www.intel.co.jp/content/www/jp/ja/download/19628/non-volatile-memory-nvm-update-utility-for-intel-ethernet-network-adapters-e810-series-vmware-esx.html?wapkw=e810%20nvm%20update>

それぞれのダウンロードページには、クイック使用ガイドというものがありますのでそこに詳細な手順が記されています。

 <https://www.intel.co.jp/content/www/jp/ja/embedded/products/networking/nvm-update-tool-vmware-esx-quick-usage-guide.html>

700シリーズのファームウェア適用の実例です。まずNICのFirmwareを確認します。対象のNIC（vmnicx）を指定し内容を確認します。`esxcli network nic get -n [物理NICのID]`

```
[root@esxi2:~] esxcli network nic get -n vmnic0
   Advertised Auto Negotiation: true
   Advertised Link Modes: Auto, 10000BaseT/Full
   Auto Negotiation: true
   Cable Type: DA
   Current Message Level: 1
   Driver Info:
         Bus Info: 0000:01:00:0
         Driver: i40en
         Firmware Version: 6.80 0x80003ce6 1.2074.0
         Version: 1.11.1.31
   Link Detected: true
   Link Status: Up
   Name: vmnic0
   PHYAddress: 0
   Pause Autonegotiate: false
   Pause RX: false
   Pause TX: false
   Supported Ports: DA
   Supports Auto Negotiation: true
   Supports Pause: true
   Supports Wakeon: true
   Transceiver:
   Virtual Address: 00:00:00:00:00:00
   Wakeon: MagicPacket(tm)
```
続いてダウンロードしたファイル（700シリーズは2022年4月2日時点では最新がv8.6です）をscpかストアブラウザを使ってESXi上にアップロードします。その後展開し実行します。700シリーズではJVN IPediaから辿ったintelの情報では、v8.2以前のFirmwareに問題があるとのことで、私はv8.5を選択しました。特に注意点はありませんが、私は実行にあたりメンテナンスモードにして（VMを停止）から開始しました。
```
[root@esxi2:] tar -xvf 700Series_NVMUpdatePackage_v8_50_ESX.tar.gz
#展開されたフォルダに入り以下を実行します。
[root@esxi2:] ./nvmupdaten64e
```

以下ではNICを全て対象、NVMイメージのバックアップは有りということで実行したログになります。
```
Intel(R) Ethernet NVM Update Tool
NVMUpdate version 1.37.28.0
Copyright(C) 2013 - 2021 Intel Corporation.


WARNING: To avoid damage to your device, do not stop the update or reboot or power off the system during this update.
Inventory in progress. Please wait [****-.....]


Num Description                          Ver.(hex)  DevId S:B    Status
=== ================================== ============ ===== ====== ==============
01) Intel(R) Ethernet Controller X710  6.128(6.80)   1572 00:001 Update
    for 10GbE SFP+                                               available

Options: Adapter Index List (comma-separated), [A]ll, e[X]it
Enter selection: A
Would you like to back up the NVM images? [Y]es/[N]o: Y
Update in progress. This operation may take several minutes.
[....|*****]


Num Description                          Ver.(hex)  DevId S:B    Status
=== ================================== ============ ===== ====== ==============
01) Intel(R) Ethernet Controller X710   8.80(8.50)   1572 00:001 Update
    for 10GbE SFP+                                               successful

Reboot is required to complete the update process.

Tool execution completed with the following status: All operations completed successfully.
Press any key to exit.

[root@esxi2:~] reboot
```
最後にリブートが必要とのことでリブートしています。

ホストが再起動後、ファームウェアが適用されているか再び確認します。

```
[root@esxi2:~] esxcli network nic get -n vmnic0
   Advertised Auto Negotiation: true
   Advertised Link Modes: Auto, 10000BaseT/Full
   Auto Negotiation: true
   Cable Type: DA
   Current Message Level: 1
   Driver Info:
         Bus Info: 0000:01:00:0
         Driver: i40en
         Firmware Version: 8.50 0x8000b6c5 1.2074.0
         Version: 1.11.1.31
   Link Detected: true
   Link Status: Up
   Name: vmnic0
   PHYAddress: 0
   Pause Autonegotiate: false
   Pause RX: false
   Pause TX: false
   Supported Ports: DA
   Supports Auto Negotiation: true
   Supports Pause: true
   Supports Wakeon: true
   Transceiver:
   Virtual Address: 00:00:00:00:00:00
   Wakeon: MagicPacket(tm)
```

`Firmware Version: 8.50`ということで、無事更新されました。

intelの手順書では、NOTEとして、以下の説明があります。
> On 700 Series and 500 Series devices, updating to the most current NVM (with the NVM Update Package) and driver does not update the Option ROM. Intel recommends an Option ROM update after the NVM and driver are updated. Refer to the User Guide for Intel® Ethernet Adapters page for the most current Option ROM update process version.

これはネットワークブート時の{% label primary@UEFI Network Driver Option ROM %}をLinuxまたはUEFIシェルを使ってUEFIネットワークドライバを更新するものです。今回はこの作業については割愛します。

## MellanoxのNICファームウェア更新

Mellanoxの場合は、NVIDIAのサイトに"How-to: Install NVIDIA Firmware Tools (MFT) on VMware ESXi 6.7/7.0."というマニュアルがありますので、そこで手順を確認します。

> How-to: Install NVIDIA Firmware Tools (MFT) on VMware ESXi 6.7/7.0.
 <https://docs.nvidia.com/networking/pages/releaseview.action?pageId=15049813>

NVIDIA Firmware Toolをダウンロードし、ESXiにインストールします。その後別途ファームウェアをダウンロードしてファームウェアのアップグレードを行います。昔はflintでしたが、上記手順によれば今はmlxfwmanagerというのが使われるようです。Windowsではそのサブセットのmlxupが一般的です。

1. ツールを2つダウンロードするために、ダウンロードページにアクセスします。
 <http://www.mellanox.com/page/management_tools>
2. 2022-04-2時点でESXi7.0向けはVersion4.18.1、ESXi6.7向けはVersion4.18.0となっています。ここではESXi7.0を例にして進めます。
3. "7 Native"、”x64”を選択し、”Mellanox-NATIVE-NMST_4.18.1.14-1OEM.700.1.0.15843807_19206114-package.zip”をダウンロードし展開します。
4. ZIPの中にはさらにZIPファイルがあり、"MEL_bootbank_nmst_4.18.1.14-1OEM.700.1.0.15843807.vib"というESXiのモジュールファイルを見つけます。 {% asset_img nmst.png 480 alt %}
5. 続いて、"Mellanox-MFT-Tools_4.18.1.14-1OEM.700.1.0.15843807_19206112-package.zip"をダウンロードし展開します。
6. こちらもZIPの中にさらにZIPファイルがあり、”mft”というフォルダの中に"MEL_bootbank_mft_4.18.1.14-0.vib"のモジュールファイルを見つけます。別にOEMというフォルダがあり、NVIDIAの手順書でもファイル名からもOEMを選ぶべきのように見えますが、OEMのフォルダのものは必要なモジュールが見つかりません。{% asset_img mft.png 480 alt %}
7. scpかストアブラウザを使いこの2つのファイルをESXiにアップロードします。2つのモジュールは1つづつインストール、リブートが必要になりますので、/tmpにコピーする場合は最初のリブートで/tmpがクリアされるのでお気をつけください。
8. ESXiにSSHで接続し、最初のモジュール(NMST)をインストールします。`esxcli software vib install -v /tmp/MEL_bootbank_nmst_4.18.1.14-1OEM.700.1.0.15843807.vib -f`
 ``` bash
[root@localhost:/tmp] esxcli software vib install -v /tmp/MEL_bootbank_nmst_4.18.1.14-1OEM.700.1.0.15843807.vib -f
Installation Result
   Message: The update completed successfully, but the system needs to be rebooted for the changes to be effective.
   Reboot Required: true
   VIBs Installed: MEL_bootbank_nmst_4.18.1.14-1OEM.700.1.0.15843807
   VIBs Removed:
   VIBs Skipped:

 ```
9. ここで一旦リブートします。
10. SSHで接続後、2つ目のモジュール(MFT-Tools)をインストールします。`esxcli software vib install -v /tmp/MEL_bootbank_mft_4.18.1.14-0.vib -f`
 ```
 [root@localhost:/tmp] esxcli software vib install -v /tmp/MEL_bootbank_mft_4.18.1.14-0.vib -f
Installation Result
   Message: The update completed successfully, but the system needs to be rebooted for the changes to be effective.
   Reboot Required: true
   VIBs Installed: MEL_bootbank_mft_4.18.1.14-0
   VIBs Removed:
   VIBs Skipped:
 ```
11. 再びリブートします。
12. ESXiにインストールされているモジュールを確認します。`esxcli software vib list`
 先頭に以下のモジュールがあるはずです。PartnerSupportedとなっており、セキュアブートのESXiでも問題ありません。
 ```
 Name                           Version                                Vendor  Acceptance Level  Install Date
-----------------------------  -------------------------------------  ------  ----------------  ------------
mft                            4.18.1.14-0                            MEL     PartnerSupported  2022-03-13
nmst                           4.18.1.14-1OEM.700.1.0.15843807        MEL     PartnerSupported  2022-03-13
 ```
13. SSHで接続後、ツールの動作確認をします。ここではConnectX3がある環境です。`cd /opt/mellanox/bin`,`./mst start`,`./mst status`,`./mst status -vv`
 ```
 [root@localhost:/opt/mellanox/bin] ./mst start
 Module mst is already loaded
 [root@localhost:/opt/mellanox/bin] ./mst status
 MST devices:
 ------------
 mt4099_pciconf0
 mt4099_pci_cr0

 [root@localhost:/opt/mellanox/bin] /opt/mellanox/bin/mst status -vv
 PCI devices:
 ------------
 DEVICE_TYPE             MST                           PCI       RDMA            NET                       NUMA
 ConnectX3(rev:1)        mt4099_pciconf0               01:00.0   net-vmnic0
 ConnectX3(rev:1)        mt4099_pci_cr0                01:00.0   net-vmnic0
 ```
14. ファームウェアアップデートに使うmlxfwmanagerの動作確認をします。`./mlxfwmanager --query`
 ```
 [root@localhost:/opt/mellanox/bin] ./mlxfwmanager --query
 Querying Mellanox devices firmware ...

 Device #1:
 ----------

  Device Type:      ConnectX3
  Part Number:      MCX311A-XCA_Ax
  Description:      ConnectX-3 EN network interface card; 10GigE; single-port SFP+; PCIe3.0 x4 8GT/s; RoHS R6
  PSID:             MT_1170110023
  PCI Device Name:  mt4099_pci_cr0
  Port1 MAC:        0002c9xxxxxx
  Port2 MAC:        0002c9xxxxxx
  Versions:         Current        Available
     FW             2.33.5220      N/A
     PXE            3.4.0467       N/A

  Status:           No matching image found
 ```
15. NVIDIAのサイトからファームウェアをダウンロードします。
　<https://network.nvidia.com/support/firmware/firmware-downloads/>
16. 該当するEthernetファームウェアを選択し、ZIPファイルをダウンロードし展開します。*.binというファイルが抽出されます。
 {% asset_img firmware.png 480 alt %}

17. scpまたはストアブラウザでbinファイルをESXiの/tmpにアップロードします。
18. ファームウェアのアップデートを行います `./mlxfwmanager -u -i /tmp/ファームウェア.bin`。ファームウェアの実行直前に確認が求められるので、"y"を入力します。
 ```
 [root@localhost:/opt/mellanox/bin] ./mlxfwmanager -u -i /tmp/fw-ConnectX3-rel-2_42_5000-MCX311A-XCA_Ax-FlexBoot-3.4.752.bin
 Querying Mellanox devices firmware ...

 Device #1:
 ----------

  Device Type:      ConnectX3
  Part Number:      MCX311A-XCA_Ax
  Description:      ConnectX-3 EN network interface card; 10GigE; single-port SFP+; PCIe3.0 x4 8GT/s; RoHS R6
  PSID:             MT_1170110023
  PCI Device Name:  mt4099_pci_cr0
  Port1 MAC:        0002c9232da0
  Port2 MAC:        0002c9232da1
  Versions:         Current        Available
     FW             2.33.5220      2.42.5000
     PXE            3.4.0467       3.4.0752

  Status:           Update required

 ---------
 Found 1 device(s) requiring firmware update...

 Perform FW update? [y/N]: y
 Device #1: Updating FW ...
 Done

 Restart needed for updates to take effect.
 ```
18. リブートします。
19. 再び、`./mlxfwmanager --query`を実行し、ファームウェアがアップデートされたか確認します。
 ```
 [root@localhost:/opt/mellanox/bin]  ./mlxfwmanager --query
 Querying Mellanox devices firmware ...

 Device #1:
 ----------

  Device Type:      ConnectX3
  Part Number:      MCX311A-XCA_Ax
  Description:      ConnectX-3 EN network interface card; 10GigE; single-port SFP+; PCIe3.0 x4 8GT/s; RoHS R6
  PSID:             MT_1170110023
  PCI Device Name:  mt4099_pci_cr0
  Port1 MAC:        0002c9xxxxxx
  Port2 MAC:        0002c9xxxxxx
  Versions:         Current        Available
     FW             2.42.5000      N/A
     PXE            3.4.0752       N/A

  Status:           No matching image found

 ```

## まとめ

intelでは新しいファームウェアについて推奨と書かれる場合があり判断が難しいケースがありますが、脆弱性や製品の組み合わせなど問題が顕在化する環境に当てはまる場合のみ、新しいファームウェアを適用すべきでしょうか。ファームウェアとドライバーとの整合性もあるのでリリースノートを参照されることをお勧めします。
