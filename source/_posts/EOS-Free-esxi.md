---
title: VMWare 無償版ESXiの提供終了について
date: 2024-01-30T20:00:00+09:00
tags: ESXi
categories:
---

## VMWare製品の買い切りモデルからサブスクリプションモデルへの移行

VMWareのKBで以下のタイトルの文書が2024/1/22に公開されています。

> VMware End Of Availability of Perpetual Licensing and SaaS Services (96168) 
 <https://kb.vmware.com/s/article/96168?lang=en_US>

第2報については、「{% post_link EOS-Free-esxi2 %}」を参照してください。

<!-- more -->

VMWareはスタンドアロン製品の提供を終了し、サブスクリプションモデルに変更されるとのこと。無償版ESXiは対象外ではという期待もありましたが、上記のKBを補足する形のブログとして以下が公開されています。

> VMware End Of Availability of Perpetual Licensing and SaaS Services (VMWare Blog)
 <https://blogs.vmware.com/cloud-foundation/2024/01/22/vmware-end-of-availability-of-perpetual-licensing-and-saas-services/>

このページではサブスクリプションへの移行可否を判断可能なプロダクト一覧があります。残念ながら、表の中の移行対象外プロダクトとして、「VMware vSphere Hypervisor (free edition)」の記載があります。

そもそもの発表は2023年12月11日の発表に遡ります。
 > VMware by Broadcom、製品ラインアップとライセンス モデルを大幅に簡素化
 <https://news.vmware.com/company/vmware-by-broadcom-business-transformation>

 正式にサブスクリプションモデルに移行する事が発表された後の製品の明確化という事ですが、ソフトウェアのダウンロード自体はいつ出来なくなっても不思議ではない状態となっています。一方、昨年末の発表でも改めて触れられていますが、すぐにサポート終了というわけではなく、あらかじめ定められたサポート期限（ジェネラルサポート期限）まではパッチなども提供されるとのことです。

## 無償版ESXiのサポート期限

無償版ESXiに関するサポート期限は以下の通りです。

{% asset_img lifecycle.png 1024 alt %}
> Product Lifecycle Matrix
 <https://lifecycle.vmware.com/#/?advancedFilter=checkbox_sup&filters=%7B%22name%22:%22esxi%22,%22lifecycle_policy%22:null,%22text%22:null%7D>

まず見るべきはパッチ提供が行われるGeneral Supportの期限です。ESXi7は2025/4/2であり、あと1年と少しです。また、ESXi8については、2027/10/11と3年半の猶予があります。

もちろん、今後それなりの費用を支払ってESXiを使う事も選択肢としては挙げられますが、ホームユーザーにとっては高額となるライセンス費用を払ってまでESXiに拘る方は少ないものと考えられます。

## 現時点で考えられるアクションプラン

このような状況からは以下のように考えられるでしょうか。

- 新規にESXiをインストールしてみたいと考えているユーザー向け
 残念ながら、無償での利用終了が覆る事は無いと考えられるため新規にホームユーザーがESXiを覚えようとする事は仕事で利用する等の理由がない限りお勧めできません。

- 既にFree ESXiを運用しているユーザー向け
  1. 代替ソフトウェアを速やかに探し、移行する
  2. ESXi8のライフサイクルが長いプロダクトにアップグレードの上、当面は情報収集し、ESXiの運用を継続する

なお、既にESXiを運用されている方であっても、何らかのトラブルでクリーンインストールが必要となる可能性は残ります。
このため、以下のアクションは速やかに行っておくべきです。またアップグレードでもISOファイルは利用できます。

1. 無償版ESXi8のモジュール（ISOファイル）をダウンロードしておくこと
2. 無償版ESXi8のライセンスを取得しておくこと
  
詳細は、「{% post_link esxi-upgrade8 %}」、「{% post_link building-setup-esxi8 %}」の記事を参照してください。

## 今後のアクションプラン

これは各個人によって仮想環境の利用方法や考え方やが異なりますので、コメントは難しいところですがポイントになる点を列挙してみます。

- 仮想環境のバックアップを主眼にする場合
　私の場合はNASのソフトウェアでVMの定期バックアップを取得しており、仮想環境の一番のメリットと感じています。
　NASによる仮想環境のバックアップはESXiおよびHyper-V Serverが対象です。
　Hyper-V Server 2019も移行対象にはなりますが、既にメインストリームの終了を2024年1月に迎えており、短命と考えられます。

  > Microsoft Lifecycle
   <https://learn.microsoft.com/ja-jp/lifecycle/products/hyperv-server-2019>

  - 今後NASのソフトウェアや他のバックアップソリューションが別の仮想環境システムに対応してくればそれが選択の候補になり得ます。
  - Windows Serverのライセンス購入も選択肢となりますが、やはり個人向けには高価で集約するコストメリットが無くなってしまいます。
  - Linuxの全体バックアップをNASで確保しつつ、LinuxのKVMで個別の仮想マシンを管理するという方法も考えられます。

- その他の仮想環境への移行を主眼にする場合
 仮想化ソフトウェアの信頼性を見極める必要があります。
 リモートワークの一部に利用している製品であれば、信頼性（安全性、可用性）が必要ですから、仮想化ソフトウェアが期待に満たない場合はベアメタルに移行する事も必要でしょう。

- コンテナへの移行など別の技術を活用する場合
 バージョンアップなどの移行が容易であればよりリソースが少なく済む可能性はあります。最新パッチの当たったイメージが開発ベンダーから提供されるならそれ以上言うことありません。セキュリティ製品などOS単位でのソフトウェアや、VLANや仮想ネットワークなど、ネットワークが主眼である場合は、他のソリューションも視野に入れることとなります。

## 補足

VMWareのコミュニティの中心的存在であるVMWareのWilliam氏（lamw）は、定期的なブログのポスト、Community(Flings)でのCommunity Driverなどの再整理など今年に入ってからも意欲的に活動されています。

> Wiliam Lam氏のブログ
 <https://williamlam.com/>

> VMWare Community(Flings)
 <https://communities.vmware.com/t5/Flings/ct-p/77>

私個人としては当面情報収集をし、急いで他のシステムに移行する事は考えていませんが、継続して代替策は検討していきたいと考えています。