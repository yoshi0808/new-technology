---
title: GPG ToolsでYubiKeyを使う
date: 2021-02-13T09:58:00+09:00
tags:
 - yubikey
categories:
 - Security
---

<p class="onepoint">この記事で実現すること</p>
macOS環境下でGPG Tools(GPG Suite)の鍵管理（署名、暗号化、SSH認証）にYubiKeyを使います。
<!-- more -->

## GPG(GnuPG)について

GPGは昔からあるオープンソースの暗号・署名の主要なコンポーネントのひとつです。日本ではパスワード付きZIPファイルのやり取り、いわゆるPPAPを無くしていく流れでもあるので、これを機会にGPGが見直されればいいなと思いこの記事を書く事にしました。特にmacOS版は複数プロダクトまたは複数バージョンに対する設定が混在していて（既に廃止された機能の説明を含む）、余計に分かりづらくなっています。

昔のPGPでの主眼であった友達の輪を広げていくという考え方は現代ではもはや少なくなってしまいました。むしろそういった信用の輪がサイバー攻撃で狙われてしまう時代です。GPGでの署名やITベンダーへのサポートのためにダンプファイルを相手の公開鍵で暗号化して送付する、ダウンロードしたファイルの署名を確認するという使われ方がメインです。

## ソフトウェア構成

GPGは基本的にはコマンドラインベースのプロダクトですが、macOSユーザーであれば、GPG Tools(GPG Suite)をお勧めします。GUIで暗号化・復号化できるのは便利です。但し、Appleメールの拡張機能でGPGを使う場合、3,000円程度の有償となります。Homebrewであれば、gpg-suite、gpg-suite-no-mail（有償のメール機能が無いもの）が該当します。**GPG Suite**を直接ダウンロードする方法もあります。~~しかし、このブログを書いている2月10日時点ではYubikeyを使うようなカードインタフェースがうまく動作しません。これは不具合としてGPG Toolsサポートに報告<https://gpgtools.tenderapp.com/discussions/feedback/16266-signing-with-a-yubikey-fails-until-i-run-gpg-card-status>があります。という事で現時点ではナイトリービルドGPG Suite 2020.2 (2989n)<https://releases.gpgtools.org/nightlies/>を使う事になります。~~

（2021-5-23　追記）
2021-5-21発表のGPG Suite 2021.1で上記の不具合は解消しています。
> GPG Suite
 <https://gpgtools.org/>

これ以外には、YubicoのykmanというYubiKey Managerのコマンドインタフェースツールが必要です。これはHomebrewで**ykman**をインストールするか、Yubicoのサイトからダウンロードし、インストールしてください。
> Yubico ykman CLI
 <https://developers.yubico.com/yubikey-manager/>

## GPG Tools(GPG Suite)の主な使い方

### GUIでのファイルの暗号化・復号化・署名

マウスの右クリック（タッチパッドは2本指のタップ）で以下のメニューが選択できます。

{% asset_img menu.png 480 alt %}

### GUIでの選択部分の暗号化・復号化・署名

文字列部分を選択し、マウスの右クリック（タッチパッドは2本指のタップ）で以下のメニューが選択できます。

{% asset_img menu2.png 480 alt %}

長い文字列でなければ、パスワード管理ソフトに入れておくほうが現実的でしょうか。

### GitHubでのVerify

GitHubでコミット時に本人が署名すると、以下の"Verified"マークが付きます。
{% asset_img verify.png 480 alt %}

### Mailでの署名と暗号化

メールの受取側がGPGを持っており、相手の公開鍵を自分のGPGに取り込んであれば、暗号化と署名を付けてメールを送れます。
{% asset_img mail.png 640 alt %}

### GPGを使ったSSH

YubiKeyで設定したPINを入力して公開鍵認証でSSH接続します。
{% asset_img ssh.png 640 alt %}

## YubiKeyを使ったGPGの鍵管理

YubiKeyを使うGPGでは主鍵(MainKey)となる認定鍵(Certify)に加え、署名(Sign)、暗号(Encrypt)、認証(Authenticate)という副鍵(SubKey)を持たせます。YubiKeyの構成上、ひとつの機能にひとつの副鍵を割り当てる事が大前提です。そしてYubiKeyを紛失した場合を考慮し、主鍵はYubiKeyには置きません。主鍵は変えず、副鍵は任意に削除、追加する事を想定しています。Yubicoでは、この副鍵を端末側で生成し、それをYubiKeyに取り込む形を推奨しています。RSA暗号2048ビットのPIVとは異なり、GPGにおけるYubiKey 4/5はRSA暗号4096ビットまで対応できます。RSA暗号は2048ビットあれば十分と考えていますが、**GitHubの推奨**としては「キーは少なくとも4096ビットである必要があります」との事。GitHubさん、そこまで必要ですか{% emoji persevere %}

> GitHub -新しいGPGキーを生成する-
 <https://docs.github.com/ja/github/authenticating-to-github/generating-a-new-gpg-key>

{% mermaid graph TD %}
 B[MainKey-Certify] --> C{SubKey}
 C -->D[Sign]
 C -->E[Encrypt]
 C -->F[Authenticate]
{% endmermaid %}

主鍵は万が一YubiKeyをなくした場合などの鍵の抹消や新しい副鍵を作る以外は使いません。USBなどに複写し安全な場所で保管する事になります。主鍵が無いと友達の輪を広げられない（相手の公開鍵に署名できない）のですが、YubiKeyを使ったGPGの使い方としては、そこに重きを置いていません。YubiKeyとGPGのセットアップはお手本となる説明があります。

{% linkgrid %}
drduh/YubiKey-Guide | https://github.com/drduh/YubiKey-Guide |(https://github.com/drduh/YubiKey-Guide) This is a guide to using YubiKey as a SmartCard for storing GPG encryption, signing and authentication keys, which can also be used for SSH.  | 12475110.png
{% endlinkgrid %}
> <https://github.com/drduh/YubiKey-Guide>

ただし、このガイドは秘密鍵を漏洩させないためにクリーンなLinux上で作業し、暗号化USBを作りセットアップするという超優等生な手順になっています。この記事では可能な限りシンプルな手順の作成を目的とし一部の手順を割愛しています。

## GPGをセットアップするための手順

大まかな手順は以下の通りです。
1. 上述した必須ソフトウェアのセットアップ、秘密鍵のバックアップのためのUSBメディア<sup>[**[1]**](#note1)</sup>を準備します
2. GPGでの鍵の作成からYubiKeyへの鍵を取り込みます
3. GPG環境を設定します
4. SSHに必要なSSH公開鍵をエクスポートします
5. GitHub署名のためのGPG公開鍵と上記SSHの鍵をGitHubにログインして登録します
6. GitHubのSSH接続および署名のためgitを設定します

### GPGの鍵作成からYubiKeyへの鍵の取り込み

#### 前提

必要なソフトウェア（GPG Suite・ykman）がインストールされている事、秘密鍵のバックアップのため、macOSで認識可能となるようフォーマット済みのUSBが用意できている前提としています。鍵の生成は出来るだけ安全な環境下で実施するために、ネットワークから切り離し、ウィルス対策ソフト以外のソフトウェアを可能な限り終了させてから作業します。また鍵の作成時にはYubiKeyの接続は必要ありません。

私はmacOSのCatalina(10.15.7)、シェルはデフォルトのZshを利用しています。また、コマンドラインエディタはvim(vi)を利用していますが、他のエディタでも構いません。GPGのコマンドインタフェースがかなり特殊な事もあって、まずはアドリブ無しにこの手順をなぞっていただく事をお勧めします。変更可能な部分は主鍵および副鍵の有効期限および鍵の種類です。鍵の種類としては特に拘りがなければRSAをお勧めします。

{% note info  %}

以下の手順では、＃から始まるコメント部分に要点を記載しています。

{% endnote %}

#### 初期設定

ターミナルを起動します。認定（Certify）鍵を無期限で作成します。

``` bash
# 一時フォルダを作成し、そこに鍵をセットアップしていきます
$ export GNUPGHOME=$(mktemp -d)
```

#### 主鍵の生成

``` bash
# 主鍵は期限無し、RSA 4096Bitで生成します
$ gpg --expert --full-gen-key
gpg (GnuPG/MacGPG2) 2.2.27; Copyright (C) 2021 Free Software Foundation, Inc.
This is free software: you are free to change and redistribute it.
There is NO WARRANTY, to the extent permitted by law.

ご希望の鍵の種類を選択してください:
   (1) RSA と RSA (デフォルト)
   (2) DSA と Elgamal
   (3) DSA (署名のみ)
   (4) RSA (署名のみ)
   (7) DSA (機能をあなた自身で設定)
   (8) RSA (機能をあなた自身で設定)
   (9) ECC と ECC
  (10) ECC (署名のみ)
  (11) ECC (機能をあなた自身で設定)
  (13) 既存の鍵
  (14) カードに存在する鍵
あなたの選択は? 8

# 機能毎にフラグという概念を持ちます。これの有効、無効の切り替えに反転という表現が使われています
鍵RSAに認められた操作: Sign Certify Encrypt Authenticate
現在の認められた操作: Sign Certify Encrypt

   (S) 署名機能を反転する
   (E) 暗号機能を反転する
   (A) 認証機能を反転する
   (Q) 完了

あなたの選択は? E

鍵RSAに認められた操作: Sign Certify Encrypt Authenticate
現在の認められた操作: Sign Certify

   (S) 署名機能を反転する
   (E) 暗号機能を反転する
   (A) 認証機能を反転する
   (Q) 完了

あなたの選択は? S

鍵RSAに認められた操作: Sign Certify Encrypt Authenticate
現在の認められた操作: Certify

   (S) 署名機能を反転する
   (E) 暗号機能を反転する
   (A) 認証機能を反転する
   (Q) 完了

あなたの選択は? Q
RSA 鍵は 1024 から 4096 ビットの長さで可能です。
鍵長は? (3072) 4096
要求された鍵長は4096ビット
鍵の有効期限を指定してください。
         0 = 鍵は無期限
      <n>  = 鍵は n 日間で期限切れ
      <n>w = 鍵は n 週間で期限切れ
      <n>m = 鍵は n か月間で期限切れ
      <n>y = 鍵は n 年間で期限切れ
鍵の有効期間は? (0)0
鍵は無期限です
これで正しいですか? (y/N) y

GnuPGはあなたの鍵を識別するためにユーザIDを構成する必要があります。

本名: Your Name
電子メール・アドレス: your@mail.com
コメント:
次のユーザIDを選択しました:
    "Your Name <your@mail.com>"

名前(N)、コメント(C)、電子メール(E)の変更、またはOK(O)か終了(Q)? O
たくさんのランダム・バイトの生成が必要です。キーボードを打つ、マウスを動か
す、ディスクにアクセスするなどの他の操作を素数生成の間に行うことで、乱数生
成器に十分なエントロピーを供給する機会を与えることができます。
たくさんのランダム・バイトの生成が必要です。キーボードを打つ、マウスを動か
す、ディスクにアクセスするなどの他の操作を素数生成の間に行うことで、乱数生
成器に十分なエントロピーを供給する機会を与えることができます。
gpg: 鍵1234567890123456を究極的に信用するよう記録しました
gpg: 失効証明書を '/tmp/xxx/openpgp-revocs.d/XXXXED7DE0C6BC105798E304D4B75A4941146XXXX.rev' に保管しました。
公開鍵と秘密鍵を作成し、署名しました。

# 上記の「鍵1234567890123456を究極的に信用するよう記録しました」のKEY番号をを環境変数KEYIDに登録します
# セットアップの間、KEYIDを何度も使うためです
$ export KEYID=1234567890123456

$ gpg --expert --edit-key $KEYID
gpg (GnuPG/MacGPG2) 2.2.27; Copyright (C) 2020 Free Software Foundation, Inc.
This is free software: you are free to change and redistribute it.
There is NO WARRANTY, to the extent permitted by law.

秘密鍵が利用できます。

sec  rsa4096/1234567890123456
     作成: 2021-01-31  有効期限: 無期限  利用法: C
[  究極  ] (1). Your Name <your@mail.com>
```

以降は副鍵を作成していきます。一般的な考えでは、有効期限は定めるべきものとされています。

#### 署名副鍵の作成

``` bash
# 副鍵は期限5年、RSA4096bitで構成します
gpg> addkey
ご希望の鍵の種類を選択してください:
   (3) DSA (署名のみ)
   (4) RSA (署名のみ)
   (5) Elgamal (暗号化のみ)
   (6) RSA (暗号化のみ)
   (7) DSA (機能をあなた自身で設定)
   (8) RSA (機能をあなた自身で設定)
  (10) ECC (署名のみ)
  (11) ECC (機能をあなた自身で設定)
  (12) ECC (暗号化のみ)
  (13) 既存の鍵
  (14) カードに存在する鍵
あなたの選択は? 4

RSA 鍵は 1024 から 4096 ビットの長さで可能です。
鍵長は? (3072) 4096
要求された鍵長は4096ビット
鍵の有効期限を指定してください。
         0 = 鍵は無期限
      <n>  = 鍵は n 日間で期限切れ
      <n>w = 鍵は n 週間で期限切れ
      <n>m = 鍵は n か月間で期限切れ
      <n>y = 鍵は n 年間で期限切れ
鍵の有効期間は? (0)5y
鍵は金  1/30 11:25:03 2026 JSTで期限切れとなります
これで正しいですか? (y/N) y
本当に作成しますか? (y/N) y
たくさんのランダム・バイトの生成が必要です。キーボードを打つ、マウスを動か
す、ディスクにアクセスするなどの他の操作を素数生成の間に行うことで、乱数生
成器に十分なエントロピーを供給する機会を与えることができます。

sec  rsa4096/1234567890123456
     作成: 2021-01-31  有効期限: 無期限  利用法: C
     信用: 究極        有効性: 究極
ssb  rsa4096/A234567890123456
     作成: 2021-01-31  有効期限: 2026-01-30  利用法: S
[  究極  ] (1). Your Name <your@mail.com>
```

#### 暗号化副鍵の作成

``` bash
# 副鍵は期限5年、RSA4096bitで構成します
gpg> addkey
ご希望の鍵の種類を選択してください:
   (3) DSA (署名のみ)
   (4) RSA (署名のみ)
   (5) Elgamal (暗号化のみ)
   (6) RSA (暗号化のみ)
   (7) DSA (機能をあなた自身で設定)
   (8) RSA (機能をあなた自身で設定)
  (10) ECC (署名のみ)
  (11) ECC (機能をあなた自身で設定)
  (12) ECC (暗号化のみ)
  (13) 既存の鍵
  (14) カードに存在する鍵
あなたの選択は? 6

RSA 鍵は 1024 から 4096 ビットの長さで可能です。
鍵長は? (3072) 4096
要求された鍵長は4096ビット
鍵の有効期限を指定してください。
         0 = 鍵は無期限
      <n>  = 鍵は n 日間で期限切れ
      <n>w = 鍵は n 週間で期限切れ
      <n>m = 鍵は n か月間で期限切れ
      <n>y = 鍵は n 年間で期限切れ
鍵の有効期間は? (0)5y
鍵は金  1/30 11:25:03 2026 JSTで期限切れとなります
これで正しいですか? (y/N) y
本当に作成しますか? (y/N) y
たくさんのランダム・バイトの生成が必要です。キーボードを打つ、マウスを動か
す、ディスクにアクセスするなどの他の操作を素数生成の間に行うことで、乱数生
成器に十分なエントロピーを供給する機会を与えることができます。

sec  rsa4096/1234567890123456
     作成: 2021-01-31  有効期限: 無期限  利用法: C
     信用: 究極        有効性: 究極
ssb  rsa4096/A234567890123456
     作成: 2021-01-31  有効期限: 2026-01-30  利用法: S
ssb  rsa4096/B234567890123456
     作成: 2021-01-31  有効期限: 2026-01-30  利用法: E
[  究極  ] (1). Your Name <your@mail.com>
```

#### 認証副鍵の作成

``` bash
# 副鍵は期限5年、RSA4096bitで構成します
gpg> addkey
ご希望の鍵の種類を選択してください:
   (3) DSA (署名のみ)
   (4) RSA (署名のみ)
   (5) Elgamal (暗号化のみ)
   (6) RSA (暗号化のみ)
   (7) DSA (機能をあなた自身で設定)
   (8) RSA (機能をあなた自身で設定)
  (10) ECC (署名のみ)
  (11) ECC (機能をあなた自身で設定)
  (12) ECC (暗号化のみ)
  (13) 既存の鍵
  (14) カードに存在する鍵
あなたの選択は? 8

鍵RSAに認められた操作: Sign Encrypt Authenticate
現在の認められた操作: Sign Encrypt

   (S) 署名機能を反転する
   (E) 暗号機能を反転する
   (A) 認証機能を反転する
   (Q) 完了

あなたの選択は? S

鍵RSAに認められた操作: Sign Encrypt Authenticate
現在の認められた操作: Encrypt

   (S) 署名機能を反転する
   (E) 暗号機能を反転する
   (A) 認証機能を反転する
   (Q) 完了

あなたの選択は? E

鍵RSAに認められた操作: Sign Encrypt Authenticate
現在の認められた操作:

   (S) 署名機能を反転する
   (E) 暗号機能を反転する
   (A) 認証機能を反転する
   (Q) 完了

あなたの選択は? A

鍵RSAに認められた操作: Sign Encrypt Authenticate
現在の認められた操作: Authenticate

   (S) 署名機能を反転する
   (E) 暗号機能を反転する
   (A) 認証機能を反転する
   (Q) 完了

あなたの選択は? Q
RSA 鍵は 1024 から 4096 ビットの長さで可能です。
鍵長は? (3072) 4096
要求された鍵長は4096ビット
鍵の有効期限を指定してください。
         0 = 鍵は無期限
      <n>  = 鍵は n 日間で期限切れ
      <n>w = 鍵は n 週間で期限切れ
      <n>m = 鍵は n か月間で期限切れ
      <n>y = 鍵は n 年間で期限切れ
鍵の有効期間は? (0)5y
鍵は金  1/30 11:25:03 2026 JSTで期限切れとなります
これで正しいですか? (y/N) y
本当に作成しますか? (y/N) y
たくさんのランダム・バイトの生成が必要です。キーボードを打つ、マウスを動か
す、ディスクにアクセスするなどの他の操作を素数生成の間に行うことで、乱数生
成器に十分なエントロピーを供給する機会を与えることができます。

sec  rsa4096/1234567890123456
     作成: 2021-01-31  有効期限: 無期限  利用法: C
     信用: 究極        有効性: 究極
ssb  rsa4096/A234567890123456
     作成: 2021-01-31  有効期限: 2026-01-30  利用法: S
ssb  rsa4096/B234567890123456
     作成: 2021-01-31  有効期限: 2026-01-30  利用法: E
ssb  rsa4096/C234567890123456
     作成: 2021-01-31  有効期限: 2026-01-30  利用法: A
[  究極  ] (1). Your Name <your@mail.com>

gpg> save
gpg> quit

```

#### 作成した鍵の確認

``` bash
$ gpg -K
/tmp/.xxx/pubring.kbx
------------------------------
sec   rsa4096 2021-01-31 [C]
      7890123456789012345678901234567890123456
uid           [  究極  ] Your Name <your@mail.com>
ssb  rsa4096/A234567890123456 2021-01-31 [S] [有効期限: 2026-01-30]
ssb  rsa4096/B234567890123456 2021-01-31 [E] [有効期限: 2026-01-30]
ssb  rsa4096/C234567890123456 2021-01-31 [A] [有効期限: 2026-01-30]
```

#### 秘密鍵のエクスポート

``` bash
#バックアップ用途に秘密鍵をエクスポートします
$ gpg --armor --export-secret-keys $KEYID > $GNUPGHOME/mastersub.key
$ gpg --armor --export-secret-subkeys $KEYID > $GNUPGHOME/sub.key
```

#### 失効証明書の作成

``` bash
$ gpg --output $GNUPGHOME/revoke.asc --gen-revoke $KEYID
```

#### USBメディアを挿入し、$GNUHOMEフォルダをバックアップ

``` bash
# ご自身の環境に応じてUSBへのパスは変更してください。Finderでコピーしても構いません
$ sudo cp -avi $GNUPGHOME /volumes/your USB path/
```

USBはアンマウントします（しばらく使わないので保存）

#### 公開鍵をホームディクレトリのpublic_key.pgpとしてエクスポート

``` bash
$ gpg --armor --output ~/public_key.pgp --export $KEYID

```

#### YubiKeyの確認

YubiKeyを接続します。

``` bash
$ gpg --card-edit

Reader ...........: Yubico YubiKey OTP FIDO CCID
Application ID ...: 12345678901234567890123456789012
Application type .: OpenPGP
Version ..........: 3.4
Manufacturer .....: Yubico
Serial number ....: 12345678
Name of cardholder: [未設定]
Language prefs ...: [未設定]
Salutation .......:
URL of public key : [未設定]
Login data .......: [未設定]
Signature PIN ....: 強制なし
Key attributes ...: rsa4096 rsa4096 rsa4096
Max. PIN lengths .: 127 127 127
PIN retry counter : 3 0 3
Signature counter : 0
KDF setting ......: off
Signature key ....: [未設定]
Encryption key....: [未設定]
Authentication key: [未設定]
General key info..: [未設定]
```

#### PINの変更

これは、前回の記事「{% post_link yubikey_ssh_github %}」のYubiKey ManagerでみたPIVのPIN、PUKとは異なります。YubikeyはGPG向けに別のPIN（デフォルト123456）、AdminPIN（デフォルト12345678）があるので、紛失時のためにも設定変更される事をお勧めします。

``` bash
gpg/card> admin
管理者コマンドが許可されています

gpg/card> passwd
gpg: OpenPGPカードno. 12345678901234567890123456789012を検出

1 - change PIN
2 - unblock PIN
3 - change Admin PIN
4 - set the Reset Code
Q - quit

あなたの選択は? 1

1 - change PIN
2 - unblock PIN
3 - change Admin PIN
4 - set the Reset Code
Q - quit

あなたの選択は? 3

1 - change PIN
2 - unblock PIN
3 - change Admin PIN
4 - set the Reset Code
Q - quit

あなたの選択は? Q
```

#### 3つの副鍵をYubiKeyに転送

YubiKeyに転送された秘密鍵は端末からは全て中身が抹消され、YubiKeyに情報がある事を示すポインタにしかなりません。もし、やりなおしが必要になった場合は、秘密鍵をバックアップから復活させてから行う必要があります。

``` bash
$ gpg --edit-key $KEYID

秘密鍵が利用できます。

sec  rsa4096/1234567890123456
     作成: 2021-01-31  有効期限: 無期限  利用法: C
     カード番号: 0006 12345678
     信用: 究極        有効性: 究極
ssb  rsa4096/A234567890123456 2021-01-31 [S] [有効期限: 2026-01-30]
ssb  rsa4096/B234567890123456 2021-01-31 [E] [有効期限: 2026-01-30]
ssb  rsa4096/C234567890123456 2021-01-31 [A] [有効期限: 2026-01-30]

```

#### 署名鍵の転送

``` bash
# 3つのキー毎にYubikeyに転送します。
# key 1 と入力する事で最初の副鍵が選択され、＊マークが付きます
gpg> key 1

sec  rsa4096/1234567890123456
     作成: 2021-01-31  有効期限: 無期限  利用法: C
     カード番号: 0006 12345678
     信用: 究極        有効性: 究極
ssb*  rsa4096/A234567890123456 2021-01-31 [S] [有効期限: 2026-01-30]
ssb  rsa4096/B234567890123456 2021-01-31 [E] [有効期限: 2026-01-30]
ssb  rsa4096/C234567890123456 2021-01-31 [A] [有効期限: 2026-01-30]

# ssb＊の"＊"マークは選択されている事を示します

gpg> keytocard
鍵を保管する場所を選択してください:
   (1) 署名鍵
   (3) 認証鍵
あなたの選択は? 1
# PinEntryにYubiKeyのAdminPINを入力し移動を完了させます
```

#### 暗号化鍵の転送

``` bash
# 署名の選択を"key 1"を入力して外し、"key 2"を入力して暗号化を選択します
gpg> key 1
gpg> key 2

sec  rsa4096/1234567890123456
     作成: 2021-01-31  有効期限: 無期限  利用法: C
     カード番号: 0006 12345678
     信用: 究極        有効性: 究極
ssb  rsa4096/A234567890123456 2021-01-31 [S] [有効期限: 2026-01-30]
ssb*  rsa4096/B234567890123456 2021-01-31 [E] [有効期限: 2026-01-30]
ssb  rsa4096/C234567890123456 2021-01-31 [A] [有効期限: 2026-01-30]

gpg> keytocard
鍵を保管する場所を選択してください:
   (2) 暗号鍵
あなたの選択は? 2
# PinEntryにYubiKeyのAdminPINを入力し移動を完了させます
```

#### 認証鍵の転送

``` bash
# 暗号化の選択を"key 2"を入力して外し、"key 3"を入力して認証を選択します
gpg> key 2
gpg> key 3

sec  rsa4096/1234567890123456
     作成: 2021-01-31  有効期限: 無期限  利用法: C
     カード番号: 0006 12345678
     信用: 究極        有効性: 究極
ssb  rsa4096/A234567890123456 2021-01-31 [S] [有効期限: 2026-01-30]
ssb  rsa4096/B234567890123456 2021-01-31 [E] [有効期限: 2026-01-30]
ssb*  rsa4096/C234567890123456 2021-01-31 [A] [有効期限: 2026-01-30]

gpg> keytocard
鍵を保管する場所を選択してください:
   (3) 認証鍵
あなたの選択は? 3
# PinEntryにYubiKeyのAdminPINを入力し移動を完了させます
gpg> save
```

#### YubiKeyへの移動を確認

``` bash
$ gpg -K
/tmp/.xxx/pubring.kbx
------------------------------
sec   rsa4096 2021-01-31 [C]
      7890123456789012345678901234567890123456
uid           [  究極  ] Your Name <your@mail.com>
ssb>  rsa4096/A234567890123456 2021-01-31 [S] [有効期限: 2026-01-30]
ssb>  rsa4096/B234567890123456 2021-01-31 [E] [有効期限: 2026-01-30]
ssb>  rsa4096/C234567890123456 2021-01-31 [A] [有効期限: 2026-01-30]

```

#### 最終確認のチェックリスト

- デフォルトから変更したYubiKeyのPINおよび管理PINを記録しました
- GPGの主鍵のパスワードを記録しました
- USBに主鍵、副鍵、および失効証明書のコピーを保管し、オフラインで保管する準備をしました
- ホームディレクトリに公開鍵のコピーを保存しました
- 鍵の生成で使った＄KEYIDの値を記録しました

#### クリーンアップ

上記のバックアップが確保されている事を前提に、作業してきた一時フォルダを削除します。

``` bash
$ sudo rm -rf $GNUPGHOME
$ gpg --delete-secret-key $KEYID
$ unset GNUPGHOME
```

クリーンアップが終了したらネットワークに接続できます。秘密鍵はもうmacOSの中に残っていません。秘密鍵は取り外したUSBと接続されているYubiKeyの中にあります。

#### 公開鍵のインポートと信頼


``` bash
$ gpg --import ~/public_key.pgp

gpg: 鍵1234567890123456: "Your Name" 新しい署名を3個
gpg: 鍵1234567890123456: "Your Name" 新しい副鍵を3個
gpg:           処理数の合計: 1
gpg:             新しい副鍵: 3
gpg:             新しい署名: 3

```
`$ export KEYID=1234567890123456`←実際に上記で生成された鍵（キー）を指定します。

``` bash
$ gpg --edit-key $KEYID

gpg> trust
pub  rsa4096/1234567890123456
     作成: 2021-01-31  有効期限: 無期限      利用法: C
     信用: 不明        有効性: 不明
ssb  rsa4096/A234567890123456
     作成: 2021-01-31  有効期限: 2026-01-30  利用法: S
     カード番号: 0006 12345678
ssb  rsa4096/B234567890123456
     作成: 2021-01-31  有効期限: 2026-01-30  利用法: E
     カード番号: 0006 12345678
ssb  rsa4096/C234567890123456
     作成: 2021-01-31  有効期限: 2026-01-30  利用法: A
     カード番号: 0006 12345678
[  究極  ] (1). Your Name <your@mail.com>
他のユーザの鍵を正しく検証するために、このユーザの信用度を決めてください
(パスポートを見せてもらったり、他から得たフィンガープリントを検査したり、などなど)

  1 = 知らない、または何とも言えない
  2 = 信用しない
  3 = まぁまぁ信用する
  4 = 充分に信用する
  5 = 究極的に信用する
  m = メーン・メニューに戻る

あなたの決定は? 5
本当にこの鍵を究極的に信用しますか? (y/N)

pub  rsa4096/1234567890123456
     作成: 2021-01-31  有効期限: 無期限      利用法: C
     信用: 究極        有効性: 不明
ssb  rsa4096/A234567890123456
     作成: 2021-01-31  有効期限: 2026-01-30  利用法: S
     カード番号: 0006 12345678
ssb  rsa4096/B234567890123456
     作成: 2021-01-31  有効期限: 2026-01-30  利用法: E
     カード番号: 0006 12345678
ssb  rsa4096/C234567890123456
     作成: 2021-01-31  有効期限: 2026-01-30  利用法: A
     カード番号: 0006 12345678
[  究極  ] (1). Your Name <your@mail.com>

gpg> quit
```

### GPG環境の設定

#### gpg-agent.confの設定

`gpg-agent.conf`に以下の内容から不足があれば追加します。3-4行目のキャッシュ時間は環境に応じて自由に変更してください。

``` bash
$ vi ~/.gnupg/gpg-agent.conf
enable-ssh-support
default-cache-ttl 600
max-cache-ttl 7200
```

#### GPG Agentの自動起動について

GPGをインストールすると、OS起動時に起動するアプリケーションがLaunchAgentに登録されます。

``` bash
$ ls /Library/LaunchAgents | grep gpg
org.gpgtools.Libmacgpg.xpc.plist
org.gpgtools.macgpg2.fix.plist
org.gpgtools.macgpg2.shutdown-gpg-agent.plist
org.gpgtools.updater.plist
```

これらに加え、ユーザー毎のログイン時のスタートアップにGPG Agentの起動を登録します。**ユーザーの**LaunchAgentsに**2つのファイル**を作成します。作成先は`/Librarly`ではなく、`＄HOME/Library`です。

``` bash
$ vi ~/Library/LaunchAgents/gnupg.gpg-agent.plist
```

``` xml
 <?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
    <dict>
        <key>Label</key>
        <string>gnupg.gpg-agent</string>
        <key>RunAtLoad</key>
        <true/>
        <key>KeepAlive</key>
        <false/>
        <key>ProgramArguments</key>
        <array>
            <string>/usr/local/MacGPG2/bin/gpg-connect-agent</string>
            <string>/bye</string>
        </array>
    </dict>
</plist>
```

``` bash
$ vi ~/Library/LaunchAgents/gnupg.gpg-agent-symlink.plist
```

``` xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/ProperyList-1.0/dtd">
<plist version="1.0">
    <dict>
        <key>Label</key>
        <string>gnupg.gpg-agent-symlink</string>
        <key>ProgramArguments</key>
        <array>
            <string>/bin/sh</string>
            <string>-c</string>
            <string>/bin/ln -sf $HOME/.gnupg/S.gpg-agent.ssh $SSH_AUTH_SOCK</string>
        </array>
        <key>RunAtLoad</key>
        <true/>
    </dict>
</plist>
```

ここまで作成したら一度macOSをログアウト、ログインします。ターミナルから以下のコマンドでGPG Agentを含めて6つのプロセスが起動している事を確認します。

``` bash
$ launchctl list | grep gpg
646	0	org.gpgtools.macgpg2.shutdown-gpg-agent
-	0	gnupg.gpg-agent
-	0	gnupg.gpg-agent-symlink
-	0	org.gpgtools.updater
-	0	org.gpgtools.macgpg2.fix
511	0	org.gpgtools.Libmacgpg.xpc
```

ここまでの作業で一旦はGPGの基本機能が使える状態になりました。文字列を選択してファイルの右クリックメニューから暗号化したりメモの文字列を署名、暗号、復号機能を確認します。

### SSH公開鍵のエクスポート

ここからはYubikey+GPGのSSH接続設定です。

`ssh-add -L` で公開鍵を取得します。

``` bash
$ ssh-add -L
ssh-rsa AAAAB4NzaC1yc2EAAAADAQABAAACAz[...]zreOKM+HwpkHzcy9DQcVG2Nw== cardno:000612345678
```

Yubikeyの公開鍵の末尾にはカード番号の記載があります。SSH公開鍵を接続先のサーバーのauthorized_keysに登録します。また、macOS側の`~/.ssh/config`は設定不要です。

ターミナルから接続テストしてみましょう。PinEntryダイアログが表示され、PIN入力後、公開鍵認証で接続されます。

### GPGの公開鍵とSSH公開鍵とをGitHubに登録

ホームディレクトリに作成した**PGP公開鍵**と**SSH公開鍵**との2つをGitHubに登録します。
GitHubサイトにログイン後、{% label primary @Account %}の"Settings"を選び、左メニューの{% label primary @SSH and GPG keys %}をクリックします。{% label primary @New SSH key %}と{% label primary @New GPG key %}というボタンをクリックしそれぞれを登録します。

まずは、SSHが行える事を確認しましょう。
``` bash
$ ssh -T git@github.com
Hi yoshi0808! You've successfully authenticated, but GitHub does not provide shell access.
```

### GitHubへの接続、署名のためのgitの設定

#### gitのSSH接続設定

gitコマンドでSSH接続を有効にするには以下を実行します
`$ git remote set-url origin git@github.com:[ユーザID]/[リポジトリ].git`

設定確認は以下の通りです
`$ git remote -v`

HTTPS接続に戻す場合は、**リモートの URL の変更**を参照してください。
> GitHub -リモートの URL の変更-
 <https://docs.github.com/ja/github/using-git/changing-a-remotes-url>

#### git署名の設定

``` bash
# ここでは主鍵を指定します
$ git config --global user.signingkey 1234567890123456
```

デフォルトですべてのコミットに署名するには、以下を実行します。

`$ git config --global commit.gpgsign true`

Visual Studio Codeをお使いの方であれば、`"git.enableCommitSigning": true`を確認します。

これまでの設定でGPG Toolsを使ったSSH接続と署名の対応は完了です{% emoji thumbsup %}。
PIV方式とは異なりGUI方式によりPINの入力も行える事、また一定時間PINはキャッシュしますので、セキュアである事と利便性を両立させています。

## （任意）YubiKeyタッチ認証

GPGで認証、署名、暗号化を行おうとしている時に、YubiKeyへのタッチを必要とさせる設定ができます。GPGのPIN入力はキャッシュしている時間がありますが、これを設定すると、GPGのアクションの前には必ずYubiKeyにタッチする必要があります。より慎重さを求める方に向いています。デフォルトではOffになっていますが、これをOnにする場合は以下のコマンドを投入します。YubiKeyがタッチを待っている間はランプが点滅します（12秒程度応答しないとギブアップします）。これはNeoなどYubiKeyの種類によっては設定できません。
認証　`$ ykman openpgp keys set-touch aut on`
署名　`$ ykman openpgp keys set-touch sig on`
暗号化　`$ ykman openpgp keys set-touch enc on`
Offにする場合は以下のコマンドになります。
認証　`$ ykman openpgp keys set-touch aut off`
署名　`$ ykman openpgp keys set-touch sig off`
暗号化　`$ ykman openpgp keys set-touch enc off`

Onの代わりに15秒キャッシュする"CACHED"という項目も設定できます。詳しくは`ykman openpgp set-touch -h`を参照します。

{% note info  %}

継続的インテグレーション（CI)など、署名、デプロイと連続動作させる時にこのCACHED設定は便利です。

{% endnote %}

## GPGとPIVとの切り替え

前回の記事「{% post_link yubikey_ssh_github %}」ではPIVカードとしての扱いについて説明しました。GPGは排他でカードを占有してしまう仕様のため、GPGを使っている時はPIVを使うYubico-Authenticatorは動きません。コマンド`$ ykaman piv info`を実行する事でGPGから切り離されPIVのインタフェースが使えるようになります。**GPG Toolsサポートでの議論**もありましたが、明確な解決が難しいまま今に至っています。実運用としては、macOS純正アプリのAutomatorを使ってPIVに切り替えてからYubico Authenticatorを起動する方法が簡単でしょうか。以下に画面キャプチャを記載しておきます。

{% asset_img automator1.png 800 alt %}

> [GPG Tools -GPGMail: Fails to sign after switch from S/MIME-
 <https://gpgtools.tenderapp.com/discussions/nightly/110-gpgmail-fails-to-sign-after-switch-from-smime>

## 副鍵の有効期限到来による再作成

ここでは主鍵の有効期限を無制限、副鍵は有効期限ありで作成しました。副鍵の有効期限が2週間程度に近づいた場合、GPGから警告の通知ダイアログが表示される場合があります。この場合はUSBにバックアップを取得した秘密鍵など一式を再び一時フォルダに戻した上で、既存の副鍵を削除、新たな副鍵を新たな期限で作成し、一度初期化したYubiKeyに再度上記の手順で再登録する事になります。SSHの公開鍵は変わりますので、再度サーバーへの配布が必要となります。

<small id="note1">**[1]**
もし暗号化USBを導入するのであれば、Finderで暗号化する方法、VeraCryptを使う方法があります
</small>