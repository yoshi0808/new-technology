---
title: XG Firewall v18のポリシーをカスタマイズする
date: 2020-03-14 13:51:51
tags:
  - XG Firewall
categories:
  - Software
---

{% note primary no-icon %}

## ポリシーのカスタマイズ

{% endnote %}

　XGにおけるWebのポリシーというのはコンテンツのカテゴリを意味します。ギャンブル、アダルトからネットショッピングやチャットやWebメールまで多岐に渡ります。こちらは個人によって定義が異なるとおもいますので、実例を示しながら、ご自身の考えに基づいて設定を進めていく事になります。まずはそのカスタマイズを行っていきます。左ペインの「Web」をクリックします。
<!-- more -->

{% asset_img rule3.png alt %}

　先ほど設定した「Default Policy」の内容がまず最初に表示されているとおもいます。初期値では、「Blocked URLs for Default Policy」と2番目の行に「Risky Downloads」および「Suspicious（※怪しいもの）」が選択されています。

　今回、カスタマイズとして、一旦「Risky Downloads」および「Suspicious」を外すためにトグルをOffにします。また、「Nudity and Adult content」の行のOn/OffのトグルをOnにします。そして右下の「変更を適用」をクリックするとポリシーの修正が有効になります。「Risky Downloads」および「Suspicious」を外すのは、Google検索で「広告」という表示のあるページが正しく表示出来ないためです。事後の対応が出来た際、改めて加える事にします。


{% note primary no-icon %}

## 外部データベース（ドメインリスト）を取り込む

{% endnote %}
　XGのデータベースだけでも十分なのですが、外部のデータベース（ドメインのリスト形式）を取り込む事が可能です。ここではサンプル的に[280blocker | モバイル広告ブロッカー](https://280blocker.net/)のデータを取り込んでみます。利用については、[ダウンロードのページ](https://280blocker.net/download/)の注意事項の確認をいただき、ご自身で利用の判断をお願いします。今回はあくまでXGの機能の紹介という事で説明させていただきます。私自身このデータベースの精度などについての評価をしておりませんのでご承知おきください。

1. ダウンロードするデータとして「広告ドメインリスト（リスト形式）」をダウンロードします
2. XGの左ペインのWebを選択し、「カテゴリ」のタブをクリックします
3. 名前は「280blocker」とします
4. 分類は「Objectionable」とします
5. 設定のカテゴリはローカルのラジオボタンを選択します
6. domainのインポートから、先ほどダウンロードしたファイルを選択し取り込みます
7. 「保存」ボタンをクリックします

　次にWebのユーザーアクティビティの設定です。

{% asset_img rule4.png alt %}

1. 画面右上の「追加」ボタンをクリックします
2. 名前は「280blocker」とします
3. 先ほど「カテゴリ」で作成した280blockerを選択し適用します
4. 最後に保存ボタンを押します

　さて、再びWebのポリシータブをクリックし、「Default Policy」の内容を表示します。ここで右側の編集（ペンのアイコン）を選択します。

{% asset_img rule5.png alt %}

1. ルールの追加ボタンを押すと、先頭にルールが作成されます
2. 先頭ルールのアクティビティを選択し「すべてのトラフィック」を削除し、「280blocker」を追加します
3. アクションは「HTTPをブロックする」というデフォルトのままです
4. ステータスのトグルをOnにしてください
5. 最後に画面を下にスクロールし、保存ボタンをクリックします

　こういったデータベースはさまざまな目的で個人向けにあれば良いのですが、なかなか入手が難しいところではあります。DNSにも危険IPや危険ドメインを排除する機能を持つPublicDNSもあります。但し、そういったDNSを利用する事でその個人が興味を持つドメインなどプライバシーが筒抜けになってしまいますので利用も難しいと考えています。