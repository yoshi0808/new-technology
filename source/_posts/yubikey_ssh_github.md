---
title: YubiKeyとSSHとGitHub
date: 2021-02-06T10:18:54+09:00
tags:
 - yubikey
categories:
 - Security
---

{% asset_img title.png 800 alt %}
<p class="onepoint">この記事で実現すること</p>

YubiKeyと関係するソフトウェアの概要説明、そして公開鍵認証でリモートホストにSSHを行えるようにします。またGitHubにコマンドラインからSSH接続できるようにします。

<!-- more -->
## Yubico社のYubiKey

Yubico社のYubiKeyはなんとなくご存知の方も多いかもしれません。指紋認証ではなく、秘密鍵をこの小さなハードウェアに埋め込み、公開鍵認証、Yubico独自のワンタイムパスワード、FIDO2、そしてGitHubやGoogleなどはWebAuthn（ウェブオースン）でYubiKeyにタッチするだけで簡単に2要素認証が可能になります。6桁のワンタイムパスワードをいちいち入力しなくて済むのは魅力的です。ただ法人向けの要素が強く、実際の使い方については情報が少ないのが現状です。しかし、Amazonなどの商品の評価では非常にユーザー満足度が高いのが見て取れます。

{% asset_img https://www.yubico.com/wp-content/uploads/2019/10/yubikey_5_family_web_op.png 640 alt %}

私はUSB-Cの最も小さい”YubiKey 5C Nano”をmacOSで使っています。2要素認証が必要な時にこの小さいデバイスに"Touch to Sign"で認証できます。

macOSでは、GitHubへの2要素認証はTouch IDによるWebAuthnが使えます。このブログを書いている時点でSafariは対応していませんが、Chrome、Edgeは対応しています。以下の通り、組み込みセンサーという表示がTouchIDに相当します。
{% asset_img touch.png 480 alt %}

細かいことを言えば、WebAuthnはパスワードを必要としない認証のはずで、GitHubのような2要素認証は定義からすると少し違うような気がします。Microsoftアカウントは、YubiKeyを事前登録する事で、アカウントやパスワードを一切入力せず、YubiKeyのタッチだけでログインできます。公開鍵認証のお手本ですね。

Yubikeyの小さいパッケージには"Get started yubico.com/start"と清々しいシンプルな記載があります。そして、このURLにアクセスすると、使えるWebサイト、サービスの一覧が表示されます。そして、そのサイトでの使い方が説明されているだけです。

Google、Facebookなどのサイトで"Touch to Sign"の2要素認証を楽しんでみてください。一度認証してしまえば、Cookieに認証情報を保存してしまうため、次からは認証不要で使うという方が大半でしょうから、楽しいのは最初だけかもしれません{% emoji sweat_smile %}

また、YubiKeyが本物かどうかのテストができます。
https://www.yubico.com/genuine/

## Yubikey Authenticator

PCのアプリケーションを使っている時には、ワンタイムパスワード（OTP）の入力のためにスマホを取り出すのが少々面倒に感じます。PCにYubico Authenticatorをインストールすればいつもの6桁の数字をコピペで入力できるようになります。当然ですが、YubiKeyが接続されている事が前提（NFCモデルはタッチが前提）になります。スキャナ機能があってデスクトップ上に表示しているOTPのバーコードを読み取る機能もありこれも便利です。

（左：YubiKey未接続、右：YubiKey接続済）
{% asset_img otp3.png 480 alt %}

## YubiKeyの少し高度な使い方
これまで説明してきただけでもYubiKeyは便利で満足度は高く感じるところですが、せっかくなのでもう少し高度な使い方について見ていきましょう。私が使っているmacOSを例にして説明しますが、あまり固有OSに偏らない形で説明していきます。YubiKeyの使い方について、私なりの解釈で難易度として3段階あります。

| 段階 | 難易度 | 実現可能になるもの                                       |
| ---- | ------ | -------------------------------------------------------- |
| 1    | 易しい | FIDO、2要素認証など                                      |
| 2    | 普通   | 秘密鍵＋PINによるSSH公開鍵認証                           |
| 3    | 高     | GnuPGによるGitHubリポジトリへのコミット時の署名およびSSH |

3番目のGnuPGを使ったGitHubの署名、SSH接続は難易度が高く、別記事にします。

GitHub開発者でなくとも、YubiKeyを使いこなすために、2段階目のSSH公開鍵認証まではやってみたいものです。SSHによる公開鍵認証、かつパスフレーズを簡素なものにするという目的で必要なソフトウェアの一覧を以下に記載します。

| Yubicoソフトウェア  | 説明                                                          |
| ------------------- | ------------------------------------------------------------- |
| YubiKey ManagerGUI) | 最初に使う管理ツール（GUI）                                   |
| Yubico PIV Tool     | SSHを行う際にPIVカード認証（公開鍵認証）方式で接続する（CLI） |
| Yubikey PIV Manager | SSHを行う際にPIVカード認証（公開鍵認証）方式で接続する（GUI） |

https://www.yubico.com/products/services-software/download/smart-card-drivers-tools/

https://developers.yubico.com/yubikey-piv-manager/Releases/

上記以外には、PKCS#11と呼ばれるスマートカードやUSBトークンを対象とした認証ライブラリが存在しますのでそれをダウンロードする必要があります（後述します）。

過去から様々な変遷があって、Yubicoでは正直ソフトウェアが乱立しています。もう使わなくなったソフトウェアや、新しいソフトウェアだけどまだ機能が移行されていないなど少しわかりづらいものがあります。

## YubiKey ManagerとYubiKeyの機能

YubiKey Manager(GUI)はYubiKeyの全体管理に使うソフトウェアです。セットアップは全く難しくありません。

{% asset_img yubi1.png 480 alt %}

{% label primary @Applications %}から、OTPを選択すると以下の画面になります。
{% asset_img yubi2.png 480 alt %}
OTPにはSlot1,2の2つのスロットがあります。Slot1のショートタッチにはOTPが割り当てられています。さらに{% label primary @Configure %}に進みます。

{% asset_img yubi3.png 480 alt %}
ここでは、Slot1に対してYubico OTP（Yubico独自のワンタイムパスワード）、チャレンジレスポンス、スタティックパスワード、OATH-HOTPが選択できます。このスロットはショートタッチ、一瞬YubiKeyに触れると、キーが入力されます。つまりキーボードのように振舞います。なお、Slot2のロングタッチに重要なアプリケーションの長めのパスワードを割り当てておくと便利です。2秒程度YubiKeyに触れているとSlot2のスタティックパスワードが入力されます。パスワード管理ソフトなどのログインには便利に使えます。

この他、FIDO2、PIVと並んでいますが、SSHで利用する場合はこのPIVが重要になります。
PIVは米国の連邦政府における政府職員の身分証明用のICカードの規格になります。

### PIN Managementについて

{% label primary @Applications %}から{% label primary @PIV %}を選択すると、"PIN Management"、"Certificates"、"Reset"と並びます。
PIVは、ICカード向けの規格に基づくものです。4つのSlotがあります。

| Slot | 説明                                        |
| ---- | ------------------------------------------- |
| 9a   | Authentication SSHでPIN入力と共に利用します |
| 9c   | Digital Signature                           |
| 9d   | Key Management                              |
| 9e   | Card Authentication                         |


SSHでは、Slot9aのAuthenticationを使うことになります。
{% asset_img yubi4.png 480 alt %}

そして、このSlot9aを用いて接続する際は、PINの認証が必要です。まず最初にPINの設定を変更しましょう。PINは日本のマイナンバーカードとほぼ扱いは同じで多少緊張感が必要です。3回入力ミスするとPUK（PIN Unlock Key）によるリセットが必要になります。PINの初期設定は"123456"となります。
Yubikeyを取り扱う会社のサイトにも説明があるので参考にしてみてください。[ペンティオ株式会社-サポート](https://www.pentio.com/yubikey/support/smartcard/)

## SSH（PIV Authentication）の設定

さて、実際のSSHの設定ですが、実は以前に自分が設定したものよりもわかりやすい方法が掲載されていたのでそちらをまず紹介させていただきます。

[ペンティオ Engineer's Blog](https://techblog.pentio.com/entry/ssh-using-yubikey)

このページで紹介している方法はWindowsもmacOSも考慮されているので多くの方の参考になるかとおもいます。

ここではYubikey ManagerとYubikey PIV Managerを用いてGUIで構成されています。また、PKCS#11のために、OpenSCライブラリをダウンロードし構成する方法が紹介されています。実際のダウンロードリンクは[こちら](https://www.pentio.com/yubikey/support/smartcard/)を参照してください。

### macOS向け
私は色々なライブラリがさまざまな場所にインストールされ、またバージョン管理が煩雑になるのを好まないため、[Homebrew](https://brew.sh/index_ja)を使っています。Macユーザーにとっては一般的なものですが、こちらを使ったインストールをお勧めします。私はYubiKey Managerは単独でインストールし、残りのYubikey関連は`brew install opensc yubico-piv-tool`としてインストールしました。openscは大型ライブラリのため、依存関係で様々なパッケージが自動インストールされます。私はopenscのインストールが終わった後に気づいたのですが、yubico-piv-toolのなかに、SSHに必要なライブラリがあるようです。私のセットアップ（macOS）は、Yubicoのサイトを参考にコマンドラインベースで行いました。

[Using PIV for SSH through PKCS #11](https://developers.yubico.com/PIV/Guides/SSH_with_PIV_and_PKCS11.html)

上記の説明のなかに"Find out where ykcs11 has been installed. For a Debian-based system, the ykcs11 module ends up in /usr/local/lib/libykcs11. On MacOS, it is in /usr/local/lib/libykcs11.dylib."と説明があります。実際に`/usr/local/lib`を確認しましたが、`libykcs11.dylib -> ../Cellar/yubico-piv-tool/2.2.0/lib/libykcs11.dylib`とインストール済みのyubico-piv-toolのライブラリにシンボリックリンクが張られていました。

## SSH接続テスト
さて、YubiKeyで秘密鍵を生成し終わったところで、公開鍵を生成します。(Pathは環境によって異なります）
``` bash
ssh-keygen -D /usr/local/opt/opensc/lib/opensc-pkcs11.so -e
```
また、Yubicoのライブラリを利用するのであれば、以下の通りです。
``` bash
ssh-keygen -D /usr/local/lib/libykcs11.dylib -e
```

出力された公開鍵を接続先のサーバーのauthorized_keysに配置します（一般的な方法であり手順は省略します）。

相手先サーバに接続してみます。
``` bash
$ ssh -I /usr/local/lib/libykcs11.dylib usr1@192.168.x.x
Enter PIN for 'YubiKey PIV #XXXXXXXX':
Welcome to Ubuntu 20.04.2 LTS (GNU/Linux 5.8.0-41-generic x86_64)
Your Hardware Enablement Stack (HWE) is supported until April 2025.
Last login: Fri Feb  5 20:59:22 2021 from 192.168.x.x
usr1@ubuntu:~$
```
PINを入力して公開鍵認証で接続できました。秘密鍵はYubiKey内部で生成されているため、漏洩する事はありません。

簡単にYubiKeyを利用してSSHに接続するためには、`~/.ssh/config`に設定を加えます。接続先ホストに対してライブラリを明示します。
``` bash
Host ubuntu
 HostName 192.168.x.x
 User usr1
 #PKCS11Provider /usr/local/opt/opensc/lib/opensc-pkcs11.so
 PKCS11Provider /usr/local/lib/libykcs11.dylib
 IdentitiesOnly yes

Host github.com
 #PKCS11Provider /usr/local/opt/opensc/lib/opensc-pkcs11.so
 PKCS11Provider /usr/local/lib/libykcs11.dylib
 IdentitiesOnly yes
```
「{% post_link esxi-security %}」の記事で触れましたが、これらの設定を行う事で、ESXiへのSSHでYubiKeyを使った公開鍵認証が可能になります。

## GitHubへのSSH接続

開発者の方であればGitHubへの接続もYubiKeyで行いたいかもしれません。私はGitHub上にブログを構築しており、普段はTerminalのコマンドラインでデプロイしています。これは2要素認証は行えませんからGitHub上でパーソナルアクセストークンを発行し、それを利用します。パーソナルアクセストークンはアプリケーション専用パスワードという事になります。それなりの文字長なので安全性は高いですが、2要素認証よりは劣ります。もしあなたが趣味としてのホームユーザーではなく開発者であり、さらに安全性を高める必要があれば、パーソナルアクセストークンをやめて、SSH接続を検討してみてください。なお、この設定には制限事項があるので後述します。

GitHubのSSH接続に関するリソースを掲載します。以下でGitHubにログインし、公開鍵を登録します。

[GitHub アカウントへの新しい SSH キーの追加](https://docs.github.com/ja/github/authenticating-to-github/adding-a-new-ssh-key-to-your-github-account)

これでPIN入力とともに、GitHubにはSSHで接続できるようになりました。
```
$ ssh -T git@github.com
Enter PIN for 'YubiKey PIV #XXXXXXXX':
Hi yoshi0808! You've successfully authenticated, but GitHub does not provide shell access.
```

また、gitコマンドでSSH接続を有効にするには以下のコマンドを実行します。
`$ git remote set-url origin git@github.com:[ユーザID]/[リポジトリ].git`

設定確認は以下の通りです
`$ git remote -v`

HTTPS接続に戻す場合は、「[リモートの URL の変更](https://docs.github.com/ja/github/using-git/changing-a-remotes-url)」を参照してください。

### SSH接続の制限事項

コマンドライン中心にgitを使われている方は問題ありませんが、YubiKeyのPIVによるPIN入力はTerminalにおける標準入出力を使用しています。従って、GUIアプリケーションを利用した時に標準入出力を使えませんから、SSH認証が失敗します。例えば、GitHub Desktopなどは以下のエラーが発生します。

{% asset_img gh-desktop.png 800 alt %}

これが困るという事であれば一旦GUIはHTTPS接続とし、パーソナルアクセストークンを必要としたアプリケーション専用にSSH接続とする使い分けが必要となります。

## macOSにおけるyubico-piv-toolでの秘密鍵作成ログ
私が過去に実行した作業ログです。コマンド投入ミスやYubicoの手順書とは異なる場合で何度か試行錯誤したものをあとで整形しています。

``` bash
[xxxx@MB-Air:~]
$ yubico-piv-tool -s 9a -a generate -o public.pem -k
Enter management key:
Successfully generated a new private key.

[xxxx@MB-Air:~]
$ yubico-piv-tool -a verify-pin -a selfsign-certificate -s 9a -S "/CN=SSH key/" -i public.pem -o cert.pem
Enter PIN:
Successfully verified PIN.
Successfully generated a new self signed certificate.

[xxxx@MB-Air:~]
$ yubico-piv-tool -a import-certificate -s 9a -i cert.pem -k
Enter management key:
Successfully imported a new certificate.

$ ssh-keygen -D /usr/local/lib/libykcs11.dylib -e > id_rsa.pub

$ ssh -I /usr/local/lib/libykcs11.dylib usr1@192.168.x.x
Enter PIN for 'YubiKey PIV #XXXXXXXX':
```
上記では公開鍵id_rsa.pubをサーバー側に配置している手順は省略しています。

## YubikeyでSSH設定してみた感想
WebAuthnや2要素認証以上にYubiKeyを使いこなそうとすると、プロダクトが新旧あり混乱しやすく難易度も上がります。一番便利だなと感じているのはbitwardenへのローカルのログインで使うスタティックパスワードだったりします。さらにGnuPGを使ったGitHubへのコミット時の署名をYubiKeyで行う事もできますが、GnuPGの理解も必要となりもっと複雑です。今回制約となったGitHub DesktopなどのSSH認証時の課題はGnuPGを使う事で完全に解決します。続きは「{% post_link yubikey_gpg %}」にその方法を記載しています。