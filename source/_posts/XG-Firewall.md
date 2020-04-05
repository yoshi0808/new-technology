---
title: Sophos XG Firewallの導入
date: 2020-02-23 09:57:41
tags:
  - XG Firewall
categories:
  - Security
#comments: false
---
{% note primary no-icon %}

## 導入の背景

{% endnote %}
元々、家庭用の無線ルータだけではセキュリティが不足していると考えてる人は多いとおもいます。私の場合、個人で持っているファイル位であれば、盗られたところで大きな問題になるわけでなし、と大きく構えておりました。数年前よりランサムウェア等の脅威が出てきた事で、それなりの対策が必要と感じてきました。街のwifiからも自宅のリソースに安全に接続したり、家のサーバーを踏み台にしてネットに繋げたいという欲も出てきて、今度はVPNが欲しいなと思い始めました。
<!-- more -->
　そもそも、iCloudかOneDriveあたりに必要なファイルはどーんと置いておけばいいんですが、漏洩よりも万が一のロストが不安です。それなりの容量だと、クラウドのお金も掛かりますしね。
　オンプレの場合は盗難や火事というリスクもあり、人によって考え方は異なりますが、利便性と安全性のバランスを取る事を目指す事になるのでしょう。個人のセキュリティというものは、ビジネスにおけるリスクを極限まで抑制するという考えではなく、何かプラス α の安心感を求める程度という目線を目指す事になるのかとおもいます。Sophos社が提供する[Sophos XG Firewall Home Edition](https://www.sophos.com/ja-jp/products/free-tools.aspx)は、業務用ながら個人向けには無料という事もあって、最良のセキュリティ防御の手段と考えています。かれこれ1年半くらいでしょうか。ずっと使わせてもらってます。

　ｖ18が発表されて、大幅に機能強化されたのは良かったのですが、残念ながら設定方法が難しくなってしまいました。こんなに高機能なものを無料で使わせて頂いてるのだから、何か貢献すべきと考え、設定内容等を公開していく事にしました。スキマ時間に書いているのでスピードが遅いのはどうかご容赦ください。

{% asset_img xg.png %}

{% note primary no-icon %}

## 主な機能

{% endnote %}

1. Firewall機能（IPフィルター、Portフィルター）
2. IPS/WAF(WAFは面倒です）
3. DDoS対策機能（個人には不要とおもいます）
4. 国別フィルター（IPv4のみ）
5. VPN（2要素認証対応）
6. DNAT（Destination NAT※LANのサーバをネットに解放）
7. DNS/DHCP(IPv4,IPv6)

　細かな説明については、[こちら](https://jscom.jp/wp-content/uploads/pamphlet_sophos_020pdf.pdf)を見て下さい。

{% note primary no-icon %}

## XG Firewall導入のメリット

{% endnote %}

1. ドメイン単位にWebサイト毎のカテゴリがされているので、ギャンブルやゲーム、アダルトなどのカテゴリで禁止ルールを設定可能
2. 接続したくない国に対してアクセス制限ができる。Webブラウジングはもちろん、自宅にサーバーを建てた場合の接続元を日本からのみに絞る事も可能（IPv4のみ）
3. IPS（Intrusion Prevention System）によるSSL通信の中身を検査できる
4. ログ機能が充実している
5. VPNにおいてパスワード＋ワンタイムパスワードによる認証が可能（Windows、Mac、iOS、Android）
6. エラーをフックし、メールでの通知が行える

{% note primary no-icon %}

## XG Firewall導入のデメリット

{% endnote %}

1. 新しいPCが必要（もちろん新品である必要はありませんが）。2枚のネットワークインタフェースが必要
2. ネットのパフォーマンスが犠牲になる。回線帯域よりもレイテンシ（遅延）が大きくなると想定される
3. XG Firewallによる保護はエンドポイントの保護を完全に不要にするものではないため、従来通りウィルス対策ソフトはインストールが必要（と考えています）

---
システム要件は以下の通りとなっています（XG Firewallの[ダウンロードページ](https://www.sophos.com/ja-jp/products/free-tools/sophos-xg-firewall-home-edition.aspx)より引用）。

>2つのネットワークインターフェースのあるIntel互換コンピュータ。(XG Firewall Home Editionをインストールすると、コンピュータにある既存のOSやファイルは上書きされます）
>Home Editionは、4コア、および6GBのRAMまでの環境に対応しています。この条件を超えるコンピュータも使用可能ですが、XG Firewall Home Editionは、上限を超える容量を活用できません。

　家庭向けとしては、技術面でかなりハードルは高いです。しかし、業務用ファイアウォールが家庭で使えるというのは非常に魅力です。興味のある方はお付き合い頂ければとおもいます。

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
