---
title: XG Firewallの通知設定を行う
tags:
  - XG Firewall
categories:
  - Security
date: 2020-04-03 22:24:39
---

{% note success  %}

## この記事で実現する内容について

XG Firewallで重要なエラーが発生した場合、VPNの接続通知、バージョンアップの通知をメールで受信できるようになります。

{% endnote %}

<!-- more -->
　XG Firewallのセットアップ時に通知用のメールアドレスを設定しました。ですがそのままだとメール通知がされません。プロバイダをはじめ、どこのサービスでも、SPAM対策がなされており、簡単にメールを送る事は出来なくなっています。
 これは、{% label info @Outbound Port 25 Blocking %}と呼ばれています。
  この回避策として、2段階認証がなされているGoogleアカウントを使う事で、メール通知が可能となります。

{% note primary no-icon %}

## Gmailからメールを通知する設定を行う

{% endnote %}

1. Googleアカウントをお持ちでない方はアカウントを作成し、あらかじめ2段階認証の設定を行ってください。次に[Googleアカウントのページ](https://myaccount.google.com/?tab=kk)に行き、左ペインの{% label info @セキュリティ %}をクリックしてください。
2. アプリパスワードをクリックします。

{% asset_img googleacount.png alt %}

3. Googleアカウントのパスワードで認証します
4. {% label info @アプリ パスワードを生成するアプリとデバイスを選択してください。 %}という説明があるので、そこでXG用のパスワードと分かるように以下を入力してください
5. アプリを選択　→　メールを選択します
6. デバイスを選択　→　その他（名前を選択）を選択します

{% asset_img googleacount1.png alt %}

7. 名前をXG Firewallのものと分かるように入力します
8. 生成ボタンをクリックします
9. 生成されたアプリパスワードが表示されます
10. パスワードを控えておきます
11. 完了ボタンをクリックし、Googleでの設定を終了します

{% asset_img googleacount2.png alt %}

　続いて、XG側の設定となります。左ペインの{% label info @管理 %}から、{% label info @通知の設定 %}をクリックします。
　以下の通り、{% label info @外部メールサーバー %}を選択し、先ほどのgmailアカウントに関する情報を入力していきます。

{% asset_img googleacount3.png alt %}

| 説明                             | 内容                                   |
| -------------------------------- | -------------------------------------- |
| メールサーバーアドレス           | smtp.gmail.com                         |
| ポート                           | 587                                    |
| ユーザ名                         | your_account@gmail.com                 |
| パスワード                       | Googleで取得した16桁のアプリパスワード |
| 接続のセキュリティ               | STARTTLS                               |
| 送信元メールアドレス             | your_account@gmail.com                 |
| メールアドレスに通知を送信       | 通知を受け取りたいメールアドレス       |
| 管理インターフェースのIPアドレス | WANのIPアドレスを選択                  |

　最後に適用をクリックします。その後通知ボタンをクリックしてみます。無事通知されたでしょうか。

{% note primary no-icon %}

## メール通知するイベントを選択する

{% endnote %}

　XGの左ペインから{% label info @システムサービス %}→{% label info @通知リスト %}と進みます。
　以下の通り、イベント毎に通知が設定可能となっているので、{% label info @メール通知 %}のトグルスイッチをオンにして、好みの通知について選択してください。

{% asset_img notify.png alt %}

　リスク観点で考えると、以下の内容をオンにしておくのがお勧めです。

- Adminのサインイン失敗
- 新しいファームウェアの通知
- システム関連（起動、CPU高、シグネチャ更新失敗）
- VPNの接続

　これまでの設定では、VPNについて、事前共有鍵＋パスワード＋ワンタイムパスワードを設定してきました。この内容はもはや鉄壁といえる内容であり、通知は不要な気もします。このあたりは利便性と堅牢さとを鑑み、設定を調整いただければとおもいます。