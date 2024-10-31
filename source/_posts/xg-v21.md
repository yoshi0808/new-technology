---
title: Sophos Firewall v21でLet's Encrypt™️と3rdパーティ脅威情報を使う
date: 2024-10-27T17:00:00+09:00
tags: XG Firewall
categories: Security
---

{% asset_img Title.png alt %}

## Sophos Firewall v21

Sophos Firewall v21が2024年10月17日に発表されました。今回はビジネスユーザーはもちろん、ホームユーザーにとっても大きな進化がありました。Let's Encryptの自動更新を含む対応と3rdパーティの脅威情報（こちらも自動更新）を取り込め、積極的な通信遮断を行えるようになっています。

<!-- more -->

v21の詳細な説明はSophos Communityを参照してください。
> <https://community.sophos.com/sophos-xg-firewall/b/blog/posts/sophos-firewall-v21-is-now-available>

リリースノートはこちらです
> <https://docs.sophos.com/releasenotes/index.html?productGroupID=nsg&productID=xg&versionID=21.0>

## Sophos Firewallのアップデート

さて、最初にSophos Firewallのアップデート方法について記載します。

管理画面にログイン後、左ペインメニューの{% label primary @バックアップ＆ファームウェア %}の{% label primary @ファームウェアの確認 %}でアップデートの案内が順次来ます。直ちにファームウェアのアップグレードの案内が来るわけでは無さそうです。ファームウェア公開後すぐの場合は個別にバージョンアップのファイルを入手します。

個別にバージョンアップのファイルを入手するには、以下のURLからダウンロードします。

<https://support.sophos.com/support/s/article/KBA-000007972?language=ja>

1. 上記画面で{% label primary @Sophos Firewall %}の{% label primary @ファームウェア %}の{% label primary @ソフトウェア %}のLinkをクリックします。
2. "SW-21.0.0_GA.SFW-169.sig"をダウンロードします。
3. Sophos Firewallの管理画面にログインし、左ペインメニューの{% label primary @バックアップ＆ファームウェア %}の{% label primary @ファームウェアのタブメニュー %}から以下の画面に赤丸で囲った矢印のアイコンをクリックし、ダウンロードしたモジュールをアップロードします。

{% asset_img verup.png 800 alt %}

アップロード＆再起動ボタンをクリックし、v21へのアップグレードを完了させます。

## Let's Encrypt

Let’s Encrypt は、非営利団体のInternet Security Research Group(ISRG)が提供する認証局でTLS暗号用の証明書を無償で提供しています。ただし、有効期限が90日と短めで頻繁に証明書の再生成が必要です。

Sophos Firewallの画面上にアクセスする際に独自ホスト名やそもそもIPアドレスでのアクセスをしているとユーザーに対する警告メッセージを表示する際に証明書エラーと表示されてしまいます。自分だけが利用するなら無視もできますが、家族で使ってもらっていてエラーの度に証明書エラーで不安にさせては本末転倒です。

Sophos Firewallの広告ブロック時のお馴染みの画面です。既にLet's Encryptの証明書が有効になっていますが、この一手間を掛けないとコンテンツブロック時にブラウザに証明書エラーの表示がされてしまいます。

{% asset_img block.png 800 alt %}

生成にはLet's Encrypt独自のお作法があり、正当なネームサーバーの管理下にサーバーが実在していることが求められます。そこにISRGからインターネットで接続可能な状態になければなりません。これはいくつかの方法がありますが、よく利用されるケースでは、 ISRGから提供される証明書生成ツールを使い、そのサーバー上にWebサーバープロセスを立ち上げ、ISRGからのリクエストに応答するというものです。ISRGがWebサーバーに到達できることが確認できたら証明書を生成してくれます。

結局、ホームユーザーはこれをするために、ダイナミックDNS（DDNS）の契約や個別ドメインを契約したり、Let's Encryptが面倒ということで有償の独自SSL/TLSを取得したりして手間とコストが掛かっていました。私の場合は、NO-IPで無償DDNSを利用し、Sophos FirewallでパブリックIPアドレスの自動更新をさせていました。そして90日に一度、手作業でLet's Encryptのスクリプトを起動させて証明書を更新していました。

その際の手順としては、UbuntuでLet's Encryptスクリプトを起動し、Sophos FirewallではDNAT（Destination NAT）を手動設定し、 InternetからFirewallのPort80に着信したら、Ubuntuに振り向けるようにしていました。さらにUbuntuで証明書が出来たら一旦、クライアントに証明書セットをダウンロードし、それをFirewallにアップロードしていました。生産性としては今ひとつです。SynologyのNASなどは全自動でやってくれますね。

これがv21からは最初に設定さえしておけば、Let’s Encryptの期限が来ると自動更新までやってくれ、とても便利です。
Webサーバーを立ち上げていらっしゃる方はIDS/IPS代わりにSophos Firewall上でTLS暗号化されたPort443として受信し、リクエストを内部のWebサーバー(http)に転送することで、WebサーバーのTLS/SSL証明書の取得の手間を省くことも容易です。

### Firewall上でのLet's Encryptの設定

まず管理者画面にログイン後、左ペインの{% label primary @証明書 %}のメニューに入ります。
新しく「Let's Encrypt™️」のタブが新たに登場していますのでそのタブを選択します。

{% asset_img le1.png 800 alt %}

{% label primary @アカウントの登録 %}ボタンをクリックし、登録が完了します。

続いて証明書のタブに戻ります。

以下のように{% label primary @アクション %}では{% label primary @Let's Encrypt証明書のリクエスト %}を選択し、{% label primary @ドメイン %}の箇所にはDDNSまたはDNSのAレコードとして登録されたホスト名＋ドメイン名（いわゆるFQDN）を登録し、{% label primary @ホスト型アドレス %}の場所はWANのPortを指定します。

{% asset_img le2.png 800 alt %}

これで保存すると、証明書の生成が行われます。

登録が終わったら左ペインの{% label primary @管理 %}のメニューから{% label primary @管理者とユーザーの設定 %}の{% label primary @管理コンソールとエンドユーザー間の操作 %}の証明書にLet's Encryptの証明書を指定します。

{% asset_img le3.png 800 alt %}

{% label primary @別のホスト名を指定する %}の場所で生成した今回のサーバー名（FQDN）を指定します。

なお、Firewallのコンソール（Advanced Shell）から、`/log/letsencrypt.log`、`/log/applog.log`でログを確認できます。
以下は、letsencrypt.logの結果です。

{% asset_img le4.png 800 alt %}

とっても簡単ですね。Firewallの上位にホームゲートウェイ（HGW）がある方は、HGWがInternetからPort80の着信の際にはSophos FirewallのWAN側IPアドレスに転送することを忘れないでください。

Sophosから、これらを動画にしたものが提供されています。

> Sophos Firewall v21:Let's Encrypt™️
 <https://techvids.sophos.com/watch/guYyvqKk6ciCkG1A2eHXoR>


## 3rdパーティの脅威情報を活用する

これまでもSophos Firewallには2種類の脅威フィードが実装されていました。無償のSophos X-Ops脅威フィードと有償のMDR脅威フィードです。セキュリティベンダーはここの情報の鮮度が売りであり、セキュリティビジネスとしてはここの情報がまさに「金の成る木」でしょうか。
MDRを契約されている法人ユーザーであれば十分なのかもしれませんが、業界の情報共有などがあるケースもあり、3rdパーティの情報を取り込
め、更新される都度、自動で定期的に取り込める機能が付いたのは価値が大きいです。

Sophos Firewallではマルウェアとして定義された情報がWebポリシーで防御出来たり、ProxyやVPNなどはアプリケーションフィルタでそれなりに未然防御は出来ます。

個人が無償で高度なセキュリティ情報が得られるほど甘くはありませんが、それでもリスクを減らすことはできるので前向きに考えたいところです。

Sophos Firewallに取り込める3rdパーティの脅威情報をここでいくつか紹介していきます。

## GreyNoise

GreyNoiseはインターネット上で悪意あるスキャンや攻撃を行っているIPアドレスを特定し、その活動に関する情報を収集・分析することを支援する脅威インテリジェンスを提供するプラットフォームです。

{% asset_img greynoise.png 1024 alt %}

GreyNoiseはWebUIとAPIで使う方法があります。WebUIは以下のURLです。

> Grey Noise Web UI
 <https://viz.greynoise.io/>

本日の情報を見てみると国別で多い順にブラジル、中国、インド、アメリカ、ロシアと続きますね。
 
{% asset_img greynoise1.png 1024 alt %}

ブラジルはオリンピックでサイバー攻撃が増えてしまったようですね。ホームユーザーにとってはロシアと中国は殆どアクセス不要だと考えればFirewallの国別フィルタでガッサリとブロックしてしまうのもアリだと思います。
左下を見ていくと、最も活動が多いのはクローラー（巡回）で脆弱性を探すタイプですね。ホームユーザーは無闇にポートを解放せず、脆弱性の無いVPNで守っておけば特にクローラー系は怖くはありません。

ホームユーザーからしてもクローラーやIoTを狙うボットなど、きちんとパッチを当てることに加え、VLANを切ってIoTは別セグメントにしておけば、個人の情報資産が脅かされるリスクは低いですが、取り敢えずこの画面の左下で目につくMiraiについては有名どころですし、クライアントがアクセスした際に感染するリスクがありますからこれは防御しておいても損はありません。Miraiはマルウェアとして活動していて、毎時6,000件の活動が見られるようです。

> Miraiについて
 IoT機器に感染した機器同士を連携させて１つの攻撃対象に一斉攻撃を仕掛ける体制（ボットネット）を作成します。攻撃者は外部のC&Cサーバーから、そのボットネットに指示を出すことでDDoS（Distributed Denial of Service attack）攻撃を行います。

IoTの攻撃よりもランサムウェアの方が個人にとっては脅威です。今回はMiraiを対象にしましたが、今後定期的に見直しをしていくつもりです。

{% asset_img greynoise2.png 1024 alt %}

GreyNoiseはサインアップすると、1つのタグだけは無償でFirewallに取り込むことができます。
BLOCKLIST URLの右側のコピーアイコンをクリックするとAPIのパスが取得できます。

サインアップ
<https://viz.greynoise.io/signup>

## CrowdSec

CrowdSecも同様にセキュリティベンダーです。コミュニティにも理解があり、無償のセキュリティエンジンなどを提供しています。しかしこちらもやはり価値のあるブロックリストは有償が基本であってコミュニティベースで寄せられた情報のみがコミュニティに無償で提供されます。

{% asset_img Crowdsec1.png 800 alt %}

アカウントを作成、ログインしてから左上のBlockListsを選択すると、BlockListのカタログを選択することになります。
Freeで絞り込むとTorのBlockListカタログなどを見つけられます（Proxyといっても差し支えありませんが、Torが頻繁に更新されることを考えると価値はあるでしょう）。タイミングによってでしょうけれども、CrowdSecが提供しているPHPの脆弱性（CVE-2024-4577）に対応したカタログなどがFreeとして公開されていますね。これは最近、日本国内の某フードデリバリーの企業でも問題になったマイニングマルウェアのRedTailが該当しますね。

{% asset_img Crowdsec3.png 800 alt %}

> Torについて
 通信の秘匿性を担保するために作られた技術ですが、現在はサイバー攻撃などを中心にダークウェブへのアクセス手段として利用されています。善良な民間人は興味本位で近づかないことをお勧めします。

 サインアップ
 <https://app.crowdsec.net/signup>

### ブロックリストの購読

ブロックリストの購読をした後（最大３つ）、インテグレーションを行い、Sophos Firewallに取り込み準備をします。

{% asset_img Crowdsec4.png 1024 alt %}

{% label primary @Blocklists %}→{% label primary @Integrations %}→{% label primary @Add Integration %}と進みます。

{% label primary @Where do you want to use blocklists? %}と聞かれますので、{% label primary @Sophos %}を選択します。続いて{% label primary @Create %}ボタンをクリックして生成します。
以下のようにダイアログが表示されますのでこれを後述するSophos Firewallの設定でコピーペーストして設定を完了させることになります。

{% asset_img Crowdsec5.png 640 alt %}

## その他

その他はURLhausやOSINTといったコミュニティベースの情報をFirewallに取り込めます。

> URLhaus
 <https://urlhaus.abuse.ch>

> OSINT
 <https://osint.digitalside.it/> 

ここでは詳細説明を割愛します。これら２つはサインアップ不要で脅威フィードを公開しています。
そのレベルとしては、MicrosoftのEdgeブラウザで提供されているスマートスクリーン相当とお考えください。
それでもSophos Firewall単体で取りこぼすケースもカバーしています（無論、古すぎる情報で無視して良いものもたくさんあります）。

## Firewallに3rdパーティの脅威情報を取り込む

Firewallの左ペインメニューから{% label primary @アクティブな脅威対応 %}を選択します。

{% asset_img sf1.png 1024 alt %}

サードパーティの脅威フィードは、ブロックと監視対象との2種類があります。前述したOSINTなどは数も多いので一旦は監視対象にしていきなりブロックはせずに様子を見る事もできます。

ここで追加ボタンをクリックして前述した3rdパーティの脅威情報を取り込みます。

{% asset_img sf2.png 480 alt %}

{% label primary @アクション %}は前述したブロックかモニタを選択します。

{% label primary @インジケータの種類 %}は、Grey NoiseやCrowdSecはIPv4アドレスを指定します。その他の脅威フィードではドメインやURLを指定する場合もあります（私は、URL_HausとOSINTではURLを指定しています）。

{% label primary @外部URL %}は、Grey Noise、CrowdSecで指定されたURL（APIのパス）を指定します。

{% label primary @承認 %}は認証の有無です。GreyNoiseは認証無し、CrowdSecは前述したようにインテグレーションしたIDとパスワードを指定します。

{% label primary @ポーリング間隔 %}は、GreyNoiseは1時間を、CrowdSecはCommunityユーザーは2時間に1度のフェッチが（今の所）認められているので、6時間を指定します。

私の場合、これら４つの脅威情報を取り込み、現時点では11,362IPアドレス、46722URLが登録されています。

## 脅威情報の留意点

前述したようにSophos FirewallでIPアドレスは取り込めますが、現時点ではIPアドレスはIPv4のものだけであることに注意が必要です。

また、URLで取り込む場合、これはURLhaus、OSINTなどがURLで提供してくれていますが、サイトがhttps（SSL/TLS）の場合はURLも暗号化されていますからSSL/TLSインスペクションの機能が必要になります。すなわち、SSL/TLSインスペクションの対応クライアント（Fierwallの自己証明書をクライアントに取り込めている場合）のみがURLのブロックが行えることに注意する必要があります。
私の環境では、Apple製品（iOS,iPad,macbook）、Windows、Linux（Ubuntu）で動作確認しています。Android、ChromeBook、IoTはSSL/TLSインスペクションは利用できません。

SSL/TLSインスペクションについては、以下の記事で解説、またSophos Firewallでの具体的な設定についてまとめています。それなりに手間が掛かることになりますから、面倒な方はURLではなく、IPアドレスで取り込む方法でも代替にはなります（IPv6は対象となりませんが）。

- {% post_link ssl-inspection %}
- {% post_link ssl-inspection1 %}
- {% post_link ssl-inspection2 %}

## ログ出力

Firewallのログにも{% label primary @アクティブな脅威対応 %}のフィルタが追加されています。

{% asset_img sf3.png 1024 alt %}

これらのように、httpsであっても検出できていることやDrop、Alertという区別がついています。OSINT、URL_Hausともに重複して検知しているケースも確認できます。
