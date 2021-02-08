---
title: YubiKeyを使ったGitHubへのSSHと署名
tags:
categories:
---



''' bash
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

本名: Yoshinobu Abe
電子メール・アドレス: y.abe0808.blog@gmail.com
コメント:
次のユーザIDを選択しました:
    "Yoshinobu Abe <y.abe0808.blog@gmail.com>"

名前(N)、コメント(C)、電子メール(E)の変更、またはOK(O)か終了(Q)? O
たくさんのランダム・バイトの生成が必要です。キーボードを打つ、マウスを動か
す、ディスクにアクセスするなどの他の操作を素数生成の間に行うことで、乱数生
成器に十分なエントロピーを供給する機会を与えることができます。
たくさんのランダム・バイトの生成が必要です。キーボードを打つ、マウスを動か
す、ディスクにアクセスするなどの他の操作を素数生成の間に行うことで、乱数生
成器に十分なエントロピーを供給する機会を与えることができます。
gpg: 鍵D4B75A4941146D25を究極的に信用するよう記録しました
gpg: 失効証明書を '/tmp/xxx/openpgp-revocs.d/BCE1ED7DE0C6BC105798E304D4B75A4941146D25.rev' に保管しました。
公開鍵と秘密鍵を作成し、署名しました。


$ gpg --expert --edit-key $KEYID
gpg (GnuPG/MacGPG2) 2.2.24; Copyright (C) 2020 Free Software Foundation, Inc.
This is free software: you are free to change and redistribute it.
There is NO WARRANTY, to the extent permitted by law.

秘密鍵が利用できます。

sec  rsa4096/D4B75A4941146D25
     作成: 2021-01-31  有効期限: 2026-01-30  利用法: E
[  究極  ] (1). Yoshinobu ABE <y.abe0808.blog@gmail.com>
```

署名
``` bash
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

sec  rsa4096/D4B75A4941146D25
     作成: 2021-01-31  有効期限: 2026-01-30  利用法: C
     信用: 究極        有効性: 究極
ssb  rsa4096/AF2DDD7A5BA77380
     作成: 2021-01-31  有効期限: 2026-01-30  利用法: S
[  究極  ] (1). YoshinobuABE <y.abe0808@gmail.com>
```

暗号化

``` bash
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

sec  rsa4096/D4B75A4941146D25
     作成: 2021-01-31  有効期限: 2026-01-30  利用法: C
     信用: 究極        有効性: 究極
ssb  rsa4096/1XXXXXXXXXXXXXXX
     作成: 2021-01-31  有効期限: 2026-01-30  利用法: S
ssb  rsa4096/2XXXXXXXXXXXXXXX
     作成: 2021-01-31  有効期限: 2026-01-30  利用法: E
[  究極  ] (1). YoshinobuABE <y.abe0808@gmail.com>

```

認証

``` bash
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

sec  rsa4096/D4B75A4941146D25
     作成: 2021-01-31  有効期限: 2026-01-30  利用法: C
     信用: 究極        有効性: 究極
ssb  rsa4096/1XXXXXXXXXXXXXXX
     作成: 2021-01-31  有効期限: 2026-01-30  利用法: S
ssb  rsa4096/2XXXXXXXXXXXXXXX
     作成: 2021-01-31  有効期限: 2026-01-30  利用法: E
ssb  rsa4096/3XXXXXXXXXXXXXXX
     作成: 2021-01-31  有効期限: 2026-01-30  利用法: A
[  究極  ] (1). YoshinobuABE <y.abe0808@gmail.com>


gpg> save
gpg> quit

'''

確認
``` bash
$ gpg -K
/tmp/.xxx/pubring.kbx
------------------------------
sec   rsa4096 2021-02-02 [C]
      52AF0C383682260E99FA7066B0099B69E48647CF
uid           [  究極  ] Yoshinobu Abe <y.abe0808@gmail.com>
ssb  rsa4096/0x1XXXXXX 2021-02-02 [S] [有効期限: 2024-02-02]
ssb  rsa4096/0x2XXXXXX 2021-02-02 [E] [有効期限: 2024-02-02]
ssb  rsa4096/0x3XXXXXX 2021-02-02 [A] [有効期限: 2024-02-02]

```

秘密鍵のエクスポート 
``` bash
$ gpg --armor --export-secret-keys $KEYID > $GNUPGHOME/mastersub.key

$ gpg --armor --export-secret-subkeys $KEYID > $GNUPGHOME/sub.key
```

失効証明書の作成
``` bash
$ gpg --output $GNUPGHOME/revoke.asc --gen-revoke $KEYID
```

USBメディアを挿入し、$GNUHOMEフォルダの内容をバックアップする（重要）。

USBはアンマウントする（しばらく使わないので保存）

公開キーをホームディクレトリのpublic_key.pgpとしてエクスポート 
``` bash
$ gpg --armor --output ~/public_key.pgp --export $KEYID 

```
