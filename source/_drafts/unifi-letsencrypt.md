---
title: unifi-letsencrypt
tags:
categories:
---


## Let's Encrypt対応（任意設定）

UniFiネットワークアプリケーションにブラウザで接続する際、独自証明書のためにエラーが出ていました。これを防止するにはLet'e EncryptでSSL証明書を取得し、3か月に1度更新することで、SSL/TLSに対応させることができます。上記で紹介したGlennr氏のシェルスクリプトには、このLet's Encrypt対応のシェルスクリプトも提供されています。

<https://community.ui.com/questions/UniFi-Installation-Scripts-or-UniFi-Easy-Update-Script-or-UniFi-Lets-Encrypt-or-UniFi-Easy-Encrypt-/ccbc7530-dd61-40a7-82ec-22b17f027776>

3番目のスクリプトである、「UNIFI LET'S ENCRPYT」が該当します。

これはUniFiネットワークアプリケーション同様にUbuntu上でシェルスクリプトを実行することで対応可能になります。但し、これには2つの条件が必要です。
- ダイナミックDNSにホスト名（FQDN)が登録されており、自宅のパブリックIPアドレスがDNSによって順引きできること
- スクリプト実行時に、Let`s Encrypt側から所在確認が入り、httpプロトコルで自宅のパブリックIPアドレス経由で、UniFiネットワークアプリケーションのUbuntuに到達する必要があります。従い、以下の条件を満たす必要があります。
 1. ホームゲートウェイでポート80を解放し、UniFiネットワークアプリケーションであるUbuntuにPort転送する必要があります
 2. UbuntuのufwでPort80を開ける必要があります
もし、Firewallなどが間に入っている場合はバケツリレーのように、HGW→Firewall→Ubuntuという具合にパケットをそれぞれ転送する必要があります。このPort解放は、証明書の更新のみで証明書が更新できた場合はまたPortを塞いで構いません。3か月後にまたPortを開けてからこのスクリプトを実行することになります。

証明書エラーが気になる方は設定されてはいかがでしょうか。

以下にLet's Encrypt証明書を取得するスクリプトの実行結果を載せておきますので、参考にしてください。Ubuntu上で実行します。

``` bash
$ sudo ufw allow 80/tcp

$ sudo -i
[sudo] xxx のパスワード:

# apt-get update; apt-get install ca-certificates wget -y

# rm unifi-easy-encrypt.sh &> /dev/null; wget https://get.glennr.nl/unifi/extra/unifi-easy-encrypt.sh && bash unifi-easy-encrypt.sh

What do you want to do?

 [   1   ]  |  Apply Let's Encrypt Certificates (recommended)
 [   2   ]  |  Apply Paid Certificates (advanced)
 [   3   ]  |  Restore previous certificates
 [   4   ]  |  Restore certificates to original state
 [   5   ]  |  Cancel

Your choice | 1

# Your timezone is set to Asia/Tokyo.
# Is your timezone correct? (Y/n) Y

# What would you like to do with the old certificates?

 [   1   ]  |  Keep all certificates. ( default )
 [   2   ]  |  Keep last 3 certificates.
 [   3   ]  |  Cancel script.

Your choice | 1

# Your FQDN is set to '192.168.xxx.222'
# Is the domain name/FQDN above correct? (Y/n) n

xxx.hoge.domain

# ‘xxx.hoge.domain’ does not resolve to ‘xx.xx.xx.xx'
# Please make an A record pointing to your server's ip.
# If you are using Cloudflare, please disable the orange cloud.

---

# Please take an option below.

 [   1   ]  |  Try to resolve your FQDN again. ( default )
 [   2   ]  |  Resolve with a external DNS server.
 [   3   ]  |  Manually set the server IP. ( for users with multiple IP addresses )
 [   4   ]  |  Cancel Script.

Your choice |2

# What external DNS server would you like to use?

 [   1   ]  |  Google          ( 8.8.8.8 )
 [   2   ]  |  Google          ( 8.8.4.4 )
 [   3   ]  |  Cloudflare      ( 1.1.1.1 )
 [   4   ]  |  Cloudflare      ( 1.0.0.1 )
 [   5   ]  |  Cisco Umbrella  ( 208.67.222.222 )
 [   6   ]  |  Cisco Umbrella  ( 208.67.220.220 )
 [   7   ]  |  Don't use external DNS servers.
 [   8   ]  |  Cancel script

Your choice | 1
# Trying to resolve ‘xxx.hoge.domain'
# ‘xxx.hoge.domain resolved correctly!

---

# Do you want to add more FQDNs? (Y/n) n

# Your current UniFi Network Application FQDN is set to '192.168.xxx.222' in the settings...
# Would you like to change it to ‘xxx.hoge.domain'?

# Would you like to apply the change? (Y/n) Y

# Do you want to setup a email address for renewal notifications? (Y/n) Y

# Please enter the email address below.
# my-email@hoge.domain

# The script successfully ended, enjoy your secure setup!

# Author   |  Glenn R.
# Email    |  glennrietveld8@hotmail.nl
# Website  |  https://GlennR.nl

```

途中、FQDNの順引きで失敗しています。`‘xxx.hoge.domain’ does not resolve to ‘xx.xx.xx.xx'`これは私の環境でLAN内のプライベートIPアドレスをDNSに登録しているためエラーとなります。自宅内から、xxx.hoge.domainにアクセスした際にプライベートIPアドレスをDNSから返してもらい、UbuntuのUniFiネットワークアプリケーションに接続する必要があります。このスクリプトではこの対策のため、2回目は外部DNSに直接アクセスする事とし、パブリックIPアドレスを無事取得しています。

このシェルスクリプト終了後は、上記で指定したFQDNでUniFiネットワークにアクセスすることになります。`https://xxx.hoge.domain:8443/`
これでSSL/TLSの証明書エラーは発生しなくなります。また、メールアドレスを登録しているので期限切れの前には登録したメアド宛に通知がもらえます。
