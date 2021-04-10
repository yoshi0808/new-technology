---
title: Sophos XG Firewallの導入
date: 2020-02-23 09:57:41
tags:
  - XG Firewall
categories:
  - Security
#comments: false
---
{% asset_img xg.png %}

## 導入の背景

元々、家庭用の無線ルータだけではセキュリティが不足していると考えていました。数年前よりランサムウェア等の脅威が出てきた事で、それなりの対策が必要と感じていました。街のWIFIからも自宅のリソースに安全に接続したり、家のサーバーを踏み台にしてネットに繋げたいというニーズもあり、VPNも必要でした。
<!-- more -->
そもそも、iCloudかOneDriveあたりにファイルを置いておけばいいんですが、漏洩よりも万が一のロストが不安です。クラウドの特徴として、提供サービスと費用が一方的に変更されやすい傾向にあるようです。オンプレミスの場合は盗難や火事というリスクもあり、人によって優先するものは異なりますが、利便性と安全性のバランスを取る事を目指すのでしょうか。個人のセキュリティは、ビジネスにおけるリスクを極限まで抑制するという考えではなく、最低限必要な対策をもれなく行うものと考えています。特に最近進歩が著しいIoT機器は追加の防御策が必要です。Sophos社が提供する[Sophos XG Firewall](https://www.sophos.com/ja-jp/products/next-gen-firewall.aspx)は、業務用ながらホームユーザーには無料という事もあって、最良のセキュリティ防御の手段と考えています。かれこれ1年半くらいでしょうか。ずっと使わせてもらってます。

v18が発表されて、大幅に機能強化されたのは良かったのですが、高度化に伴い設定方法が難しくなってしまいました。こんなに高機能なものを無料で使わせて頂いてるのだから、何か貢献すべきと考え、設定内容等を公開していく事にしました。

## 主な機能

- Firewall機能（IPフィルター、Portフィルター）
- IPS/WAF
- コンテンツフィルター（Webフィルター、アプリケーションフィルター）
- DDoS対策機能
- 国別フィルター（IPv4のみ）
- VPN（2要素認証対応）
- サーバ公開
- DNS/DHCP(IPv4,IPv6)

## XG Firewall導入メリット

1. レイヤ7Firewall（次世代Firewall）により、アプリケーション単位、ギャンブルやゲーム、アダルトなどのカテゴリで禁止ルールを設定可能
2. 接続したくない国に対してアクセス制限ができる。Webブラウジングはもちろん、自宅にサーバーを建てた場合の接続元を日本からのみに絞る事も可能（IPv4のみ）
3. SSL/TLSインスペクションによりSSL/TLS通信の中身を検査し、さまざまな脅威からの保護
4. ログ機能が充実している
5. VPNが提供可能。ダイナミックDNSによる接続容易性に加え、ワンタイムパスワードによる2要素認証が可能（Windows、Mac、iOS、Android）
6. エラーをフックし、メールでの通知が行える

## XG Firewall導入の留意点

1. 新しいPCが必要（新品である必要はありません）。2枚のネットワークインタフェースが必要
2. ネットのパフォーマンスが犠牲になる。回線帯域よりもレイテンシ（遅延）が大きくなる
3. XG Firewallによる保護はエンドポイントの保護を完全に不要にするものではないため、従来通りウィルス対策ソフト（Windows Defenderを含む）は必要

システム要件は以下の通りとなっています（XG Firewallの[ダウンロードページ](https://www.sophos.com/ja-jp/products/free-tools/sophos-xg-firewall-home-edition.aspx)より引用）。

>2つのネットワークインターフェースのあるIntel互換コンピュータ。（XG Firewall Home Editionをインストールすると、コンピュータにある既存のOSやファイルは上書きされます）
>Home Editionは、4コア、および6GBのRAMまでの環境に対応しています。この条件を超えるコンピュータも使用可能ですが、XG Firewall Home Editionは、上限を超える容量を活用できません。

ホームユーザーには技術面でハードルは高いです。しかしながら業務用ファイアウォールが家庭で使えるというのは非常に魅力です。興味のある方はお付き合いください。

※XG Firewall v18の記事一覧

- {% post_link provision %}
- {% post_link esxi %}
- {% post_link esxi-conf %}
- {% post_link InstallXG %}
- {% post_link InstallXG2 %}
- {% post_link XG-MainPage %}
- {% post_link rule-policy1 %}
- {% post_link rule-policy2 %}
- {% post_link customize-policy %}
- {% post_link ssl-inspection %}
- {% post_link ssl-inspection1 %}
- {% post_link ssl-inspection2 %}
- {% post_link SophosCommunity %}
- {% post_link vpn %}
- {% post_link vpnotp %}
- {% post_link vpn-iphone %}
- {% post_link Notifications %}
- {% post_link dnat %}
- {% post_link ipv6 %}
- {% post_link xg-ipv6-1 %}
- {% post_link xg-ipv6-2 %}
- {% post_link ips-policy %}
- {% post_link web-application-filter %}
- {% post_link best-practice %}
- {% post_link Intercept-DNS %}
- {% post_link protect-xg %}
- {% post_link xg-v18-mr3 %}
- {% post_link xg-v18-mr4 %}
- {% post_link xg-v18-mr5 %}
