---
title: Proxmox運用にAnsibleとAIを活用する：Semaphore UIでAnsibleを定期実行する
date: 2026-07-20T17:00:00+09:00
tags: proxmox
categories:
 - AI
 - Ansible
---

{% asset_img Title.png 1024 alt %}

<p class="onepoint">この記事で実現すること</p>

前回の記事では、AIを使ってAnsibleのPlaybookを実装しました。作成したコードはGitにも登録し、変更内容を管理できる状態にしています。
今回は、本格的なAnsible運用へ進むため、Semaphore UIを導入します。作成したPlaybookをWebブラウザから実行し、決められた時間に定期実行できる環境を構築します。さらに、PlaybookをGitHubのPrivate Repositoryで管理し、実行結果をSlackへ通知できるところまで進めます。

- （前回記事）{% post_link ai-ansible2 %}

<!-- more -->

## 今回の構成

今回も前回に引き続き、テスト環境を使って構築を進めます。

前回は、Ansible実行環境として `test-ansible`、操作対象として `test-vm` という2台のUbuntu 26.04 Server VMを作成しました。
Ansibleのリポジトリは、`test-ansible` のユーザーのホームディレクトリ配下にある `~/test-ansible` です。ローカル端末からVS CodeのRemote - SSHを使って接続し、Playbookを編集します。私の環境では、ローカル端末としてmacOSを使用しています。

今回は、この `test-ansible` にSemaphore UIを導入します。前回作成したPlaybookをGitHubへ登録し、Semaphore UIがGitHubからコードを取得して `test-vm` に対して実行する構成です。

また、実行結果を確認できるよう、Slackへの通知も追加します。昔ながらのメール通知でも構いませんが、やや時代遅れ感もあります。Slackはこういった単純な使い方であれば無料ですし、ハッシュタグで目的別に内容を確認できて便利です。実運用に入るとかなり目的毎に分類する方が運用しやすいので通知にはSlackを導入されることをお勧めします。蛇足ながら、Proxmoxからの通知に加え、（今回は関係ないですが）UniFiのネットワーク機器の管理についてもSlackへの通知機能がありますので、ホームラボからの通知をSlackに一本化できるメリットがあります。

{% asset_img infrastructure.png 1024 alt %}

私の場合は、クライアントにmacOSを使っていますが、Ansible開発はSSHした先のUbuntuなのでWindowsであっても問題ありません。VS Codeが使える環境が必要です。前回の作成した構成を再度利用しますので、これ以降のセットアップでは、事前準備としては前回の記事をご覧ください。

## Semaphore UIについて

GitHub、Ansibleなど自動化タスクを実行するために使用される、セルフホストの継続的自動化およびデプロイメントツールです。有償版、無償版(OSS)とがあります。今回はOSSを使います。

日本語のWebサイトもありますが、実際の中身はGitHubと英語のドキュメントが中心です。
<https://semaphoreui.com/ja>

が、メニューからSemaphore UI Communityを選ぶと、GitHubに飛びます。
<https://github.com/semaphoreui/semaphore>

SemaphoreのDocumentsです。
<https://semaphoreui.com/docs>

作成したAnsibleコードをGUIから起動したり、タイマー起動できるようになります。Proxmoxが代表格ですが、特にパッチ適用が頻繁に発生します。気が向いたらパッチ適用ということはセキュリティ上、厳しいですので自動パッチといかないまでもパッチ情報は遅延なく把握し、メンテナンス計画を設けたいものです。

SemaphoreはGitHubのリポジトリを常に正として扱います。安定した運用を第一に考えるなら、決められた時間にパッチやヘルスチェックなどの実行、モニタリングが必要と考えています。前者のパッチやヘルスチェックなどはSemaphoreUIを中心にワークフローが回せます。

## ローカルGitリポジトリをGitHubへ登録する

### GitHub用のSSHキーを作成する

Semaphore UIからはGitHubリポジトリに接続する必要があります。SSHキー、パーソナルアクセストークンなどで接続することになりますが、ここではSSHキーで進めます。
> GitHubのアカウントをお持ちでない方は、あらかじめ作成しておいてください。

前回から、Ansibleの開発環境は `test-ansible` 上に構築しています。GitHubへ接続するSSHキーの例示も、この `test-ansible` 上で作成します。

ローカル端末がWindowsやmacOSであっても、VS CodeのRemote - SSHで接続しているため、以下のコマンドはお使いのAnsible端末（リモートホスト）上で実行してください。

```bash
ssh-keygen -t ed25519 \
  -C "GitHub (test-ansible)" \
  -f ~/.ssh/id_ed25519_github
```

実行するとパスフレーズの入力を求められます。セキュリティを重視する場合は設定することをお勧めしますが、今回は検証環境のため未設定（Enterキーを2回押下）とします。

作成されるファイルは以下の2つです。

- `~/.ssh/id_ed25519_github`（秘密鍵）
- `~/.ssh/id_ed25519_github.pub`（公開鍵）

公開鍵の内容を表示します。

```bash
cat ~/.ssh/id_ed25519_github.pub
```

表示された公開鍵をコピーし、次の手順でGitHubへ登録します。

### GitHubへ公開鍵を登録する

`https://github.com/settings/ssh/new`を開くと、SSHキーを登録する画面となります。

{% asset_img sshkey1.png 800 alt %}

Titleにはわかりやすい説明を、Key Typeは”Authentication Key”、KeyにはSSH公開鍵を貼り付けて保存（Add SSH Key）してください。

### SSH接続を確認する

公開鍵を登録したら、`test-ansible` からGitHubへSSH接続できることを確認します。

```bash
ssh -i ~/.ssh/id_ed25519_github -T git@github.com
```

初回接続時は以下のようなメッセージが表示されます。

```text
The authenticity of host 'github.com (xxx.xxx.xxx.xxx)' can't be established.
ED25519 key fingerprint is SHA256:xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.
Are you sure you want to continue connecting (yes/no/[fingerprint])?
```

内容を確認し、`yes` を入力してください。

接続に成功すると、以下のようなメッセージが表示されます。

```text
Hi <GitHubユーザー名>! You've successfully authenticated, but GitHub does not provide shell access.
```

このメッセージが表示されれば、SSHキーの登録は正常に完了しています。

続いて`.ssh/config`も設定しておきます。

``` text
cat <<EOF >> ~/.ssh/config
Host github.com
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_ed25519_github
    IdentitiesOnly yes
EOF

chmod 600 ~/.ssh/config
```

これでシンプルに`ssh -T git@github.com`やgitコマンドが鍵指定なしで実行できます。

### GitHub CLIをインストールする

GitHubでは、リポジトリの作成や管理をコマンドラインから行えるGitHub CLI（`gh`）が提供されています。

今回はGitHub CLIを利用して、Private Repositoryを作成します。

```bash
sudo apt update
sudo apt install gh
```

インストールできたら、バージョンを確認します。

```bash
gh --version
```

### GitHubへログインする

GitHub CLIからGitHubへログインします。

```bash
gh auth login
```

対話形式で質問されるので、以下のように選択します。"your-user"やSSHキーは環境に応じて変わります。

gh auth login
- What account do you want to log into? GitHub.com
- What is your preferred protocol for Git operations on this host? SSH
- Upload your SSH public key to your GitHub account? /home/your-user/.ssh/id_ed25519_github.pub
- Title for your SSH key: GitHub CLI
- How would you like to authenticate GitHub CLI? Login with a web browser

ブラウザが起動し、認証コードが表示されます。GitHubへログインして認証を完了してください。

{% asset_img github0.png 240 alt %}

認証が終わったら、ログイン状態を確認します。

```bash
gh auth status
```

### Private Repositoryを作成する

認証が完了したら、ローカルGitリポジトリをGitHubのPrivate Repositoryとして登録します。
※（前回の記事で実施したローカルでgit init、ブランチをmainに設定していることが前提です）

```bash
cd ~/test-ansible

gh repo create test-ansible \
  --private \
  --source=. \
  --remote=origin \
  --push
```

これでGitHub上にPrivate Repositoryが作成され、ローカルリポジトリとの関連付けと初回Pushまで自動的に行われます。
``` text
✓ Created repository your-git-account/test-ansible on GitHub
✓ Added remote git@github.com:your-git-account/test-ansible.git
To github.com:your-git-account/test-ansible.git
 * [new branch]      HEAD -> main
branch 'main' set up to track 'origin/main'.
✓ Pushed commits to git@github.com:your-git-account/test-ansible.git
```

これでブラウザからtest-ansibleのリポジトリを確認すると前回作成したコードが登録されていることがわかります。

{% asset_img github1.png 800 alt %}

## Semaphore UIをインストールする

これまではターミナルから `ansible-playbook` を実行していました。

ここからは、WebブラウザからPlaybookを実行したり、定期実行したりできる **Semaphore UI** を導入します。

SemaphoreはオープンソースのAnsible管理ツールであり、Playbookの実行履歴やスケジュール管理、GitHubとの連携などをGUIから行えます。

今回は執筆時点で最新版の **2.18.12** を利用します。

### Semaphoreをインストールする

まずはGitHub Releasesからパッケージをダウンロードしてインストールします。

ダウンロード先には一時ディレクトリである `/tmp` を利用します。ここにはインストール用の `.deb` パッケージを一時的に保存するだけであり、インストール後に削除されても問題ありません。
これまでの手順はAnsibleを学ぶためのテスト環境を前提としていました。一方、ここから紹介するSemaphore UIの構成は、私自身が実際のホームラボで採用している考え方をベースにしています。ファイルパスやユーザー名（your-user）は環境に合わせて読み替えていただければ、そのまま実運用にも利用できる構成です。

```bash
cd /tmp

SEMAPHORE_VERSION="2.18.12"

wget "https://github.com/semaphoreui/semaphore/releases/download/v${SEMAPHORE_VERSION}/semaphore_${SEMAPHORE_VERSION}_linux_amd64.deb"

sudo apt update
sudo apt install -y ./semaphore_${SEMAPHORE_VERSION}_linux_amd64.deb
```

インストールできたら確認します。

```bash
which semaphore
semaphore version
```

正常にインストールされていれば、以下のように表示されます。

```text
/usr/bin/semaphore
2.18.12-...
```

### ディレクトリを作成する

Semaphoreの設定ファイルやデータベース、GitHubから取得したPlaybookを保存するため、あらかじめディレクトリを作成します。

今回はAnsibleを実行しているユーザーと同じ（Ubuntuをセットアップした時のデフォルト）ユーザーでSemaphoreを動作させます。これにより、CLIから実行した場合と権限の違いを意識せずに運用できます。以下の”your-user”は実際の環境に置き換えてください。

```bash
sudo mkdir -p /etc/semaphore
sudo mkdir -p /var/lib/semaphore
sudo mkdir -p /var/log/semaphore
sudo mkdir -p /var/backups/semaphore
sudo mkdir -p /opt/semaphore

sudo chown -R your-user:your-user \
    /etc/semaphore \
    /var/lib/semaphore \
    /var/log/semaphore \
    /var/backups/semaphore \
    /opt/semaphore

sudo chmod 700 /etc/semaphore /var/lib/semaphore
```

### 初期セットアップを実行する

続いて初期設定を行います。

```bash
semaphore setup
```

以下の内容で設定してください。

| 項目                    | 設定値                            |
| ----------------------- | --------------------------------- |
| Database                | SQLite                            |
| DB Hostname             | `/var/lib/semaphore/semaphore.db` |
| Playbook path           | `/opt/semaphore`                  |
| Config output directory | `/etc/semaphore`                  |
| Admin user              | `your-user`                       |
| Admin email             | 任意(省略不可)                    |
| Admin password          | 任意の強力なパスワード            |

通知についても聞かれますが、今のところは全てNoと答えてください。

セットアップが完了したら、設定ファイルとデータベースが作成されていることを確認します。

```bash
ls -l /etc/semaphore/config.json /var/lib/semaphore/semaphore.db
```

`config.json` には暗号化キーなどの重要な情報が含まれるため、アクセス権限を制限しておきます。

```bash
chmod 600 /etc/semaphore/config.json
chmod 600 /var/lib/semaphore/semaphore.db
```

### systemdへ登録する

今回はサービスとして起動できるようにsystemdへ登録します。

これにより、OS起動時の自動起動や `systemctl` による管理ができるようになります。
引き続き、ユーザー名の`your-user`の部分は読み替えてください。それ以外は今回セットアップしたフォルダ構成に基づいて構成されています。

```bash
sudo tee /etc/systemd/system/semaphore.service >/dev/null <<'EOF'
[Unit]
Description=Semaphore UI
Documentation=https://semaphoreui.com/docs
Wants=network-online.target
After=network-online.target
ConditionPathExists=/usr/bin/semaphore
ConditionPathExists=/etc/semaphore/config.json

[Service]
Type=simple
User=your-user
Group=your-user
WorkingDirectory=/opt/semaphore
Environment=HOME=/home/your-user
Environment=PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/home/your-user/.local/bin
ExecStart=/usr/bin/semaphore server --config /etc/semaphore/config.json
ExecReload=/bin/kill -HUP $MAINPID
Restart=always
RestartSec=10s
StandardOutput=journal
StandardError=journal
SyslogIdentifier=semaphore

[Install]
WantedBy=multi-user.target
EOF
```

登録したらサービスを有効化します。

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now semaphore
sudo systemctl status semaphore --no-pager -l
```

最後にポート3000で待ち受けていることを確認します。

```bash
sudo ss -ltnp | grep :3000
```

以下のように表示されれば、Semaphore UIの起動は完了です。

```text
LISTEN ... :3000 ...
```

ブラウザで以下のURLにアクセスするとSemaphore UIのログイン画面が表示されます。

```
http://<test-ansibleのIPアドレス>:3000
```

{% asset_img semaphore1.png 360 alt %}


## Semaphore UIの初期設定

セットアップ時に作成した管理者ユーザーでログインしてください。

ログインすると、初期状態ではProjectが存在しないため、以下のような画面が表示されます。

{% asset_img semaphore-project.png 1024 alt %}

まずは **新しいプロジェクト** をクリックし、Projectを作成します。

プロジェクト名には任意の名前を入力します。今回は `Test Ansible` とします。そして、「このプロジェクトのアラートを許可」のチェックボックスをONにします。最後に作成ボタンをクリックします。

プロジェクトを作成すると、Ansibleコードを保管するリポジトリやサーバーなどの定義をするインベントリなどの設定を追加できるようになります。ここからはAnsibleを実行するための環境を登録していきます。

## Semaphore UIにAnsible実行環境を登録する

Ansibleを実行するには、最低限以下の情報をSemaphoreへ登録する必要があります。

- GitHub Repository
- SSHキー
- インベントリ
- タスクテンプレート

これらを一度登録してしまえば、以降はブラウザからPlaybookを実行できるようになります。

今回は以下の順番で設定していきます。

1. キーのストア
2. リポジトリ
3. インベントリ
4. タスクテンプレート
5. スケジュール

### SSH Keyの登録

左ペインから **Key Store** を選択し、画面右上の **新しいキー** をクリックします。

{% asset_img semaphore-project1.png 1024 alt %}

キー名は「**GitHub SSH Key**」など、分かりやすい名前を付けます。

**Store** は **Local**、**Type** は **SSH Key** を選択してください。

続いて、GitHubへ登録したSSHキーの**秘密鍵**を登録します。

`test-ansible` で以下のコマンドを実行し、秘密鍵の内容を表示します。

```bash
cat ~/.ssh/id_ed25519_github
```

> **注意**
>
> `id_ed25519_github.pub` は公開鍵です。ここで登録するのは **`.pub` が付いていない秘密鍵**です。

表示された内容を **秘密鍵** 欄へ貼り付けます。

秘密鍵は以下のように、先頭が

```text
-----BEGIN OPENSSH PRIVATE KEY-----
```

で始まり、末尾が

```text
-----END OPENSSH PRIVATE KEY-----
```

で終わっていることを確認してください。

最後に **作成** をクリックすると、SSHキーの登録は完了です。

### GitHub Repositoryの登録

続いて、Playbookを取得するGitHubリポジトリを登録します。

左ペインから **リポジトリ** を選択し、画面右上の **新しいリポジトリ** をクリックします。

{% asset_img semaphore-repository1.png 1024 alt %}

各項目は以下のように設定します。<GitHubユーザー名>やリポジトリの名前(test-ansible.git)は環境に応じてに置き換えてください。

| 項目    | 設定値                                               |
| ------- | ---------------------------------------------------- |
| Name    | Test Ansible                                         |
| Git URL | `git@github.com:<GitHubユーザー名>/test-ansible.git` |
| SSH Key | 先ほど登録した **GitHub SSH Key**                    |
| Branch  | `main`                                               |

入力が完了したら **作成** をクリックします。

登録が完了すると、SemaphoreはこのGitHubリポジトリからPlaybookを取得して実行できるようになります。

Git URLを確認する場合は、GitHubのリポジトリ画面から **Code** → **SSH** を選択すると確認できます。

{% asset_img github-code-ssh.png 1024 alt %}

### Ansible接続用SSHキーの登録

続いて、Semaphoreから管理対象サーバーへSSH接続するための秘密鍵を登録します。

先ほど登録した **GitHub SSH Key** は、GitHubからPlaybookを取得するためのSSHキーです。今回登録するSSHキーは、Ansibleが `test-vm` へ接続してPlaybookを実行するために使用します。

前回の記事では、`test-ansible` から `test-vm` へ接続するため、`ansible` ユーザー用のSSHキーを作成しました。今回は、その秘密鍵をSemaphoreへ登録します。こちらも実環境に合わせて読み替えてください。

左ペインから **キーのストア** を選択し、画面右上の **新しいキー** をクリックします。

キー名は「**Ansible SSH Key**」など、用途が分かる名前にします。**Store** は **Local**、**Type** は **SSH Key** を選択してください。

`test-ansible` で、前回作成した秘密鍵の内容を確認します。前回はClaude Codeが生成してくれました。

```bash
cat ~/.ssh/id_ed25519
```

> 使用する秘密鍵のファイル名は、前回SSHキーを作成した際の指定によって異なります。別のファイル名で作成した場合は、実際のパスに読み替えてください。

表示された秘密鍵を、Semaphoreの **秘密鍵** 欄へ貼り付けます。

ここでも、`.pub` が付いていない方を使用します。秘密鍵が以下の行で始まっていることを確認してください。

```text
-----BEGIN OPENSSH PRIVATE KEY-----
```

SSHキーにパスフレーズを設定している場合は、対応するパスフレーズも入力します。

最後に **作成** をクリックして登録を完了します。

これでSSHKeyはGitHub用とAnsible用（他のノードを操作するためにSSHするためのもの）と2つが登録完了しました。

### インベントリの登録

続いて、Ansibleの管理対象となるサーバーをインベントリへ登録します。

インベントリには、Ansibleが管理するサーバーの一覧を登録します。

左ペインから **インベントリ** を選択し、画面右上の **新しいインベントリ** をクリックします。

{% asset_img semaphore-inventory1.png 1024 alt %}

以下の内容を入力します。

| 項目                         | 設定値                  |
| ---------------------------- | ----------------------- |
| 名前                         | Test Inventory          |
| ユーザー資格情報             | "Ansible SSH Key"を選択 |
| タイプ                       | File                    |
| インベントリファイルへのパス | inventories/hosts.yml   |
| リポジトリ（Optional）       | "Test Ansible"を選択    |

これで、Ansibleの実行対象となるサーバーがInventoryへ登録されました。

## 最初のTask Templateを作る

最初のTask Templateは前回作ったものを取り込む形にしましょう。
前回、test-ansibleでは、`playbooks/status_check.yml`というtest-vmのステータスチェックを行うPlaybookを作成しましたね。これをSemaphoreに登録します。

左ペインから”タスクテンプレート”をクリックし、画面右上の新しいテンプレートをクリックしてから、"Test Ansible"をクリックします。

{% asset_img semaphore-template1.png 1024 alt %}

以下のように入力または選択します

| 項目                         | 設定値                     |
| ---------------------------- | -------------------------- |
| 名前                         | Status Check test-vm       |
| プレイブックファイルへのパス | playbooks/status_check.yml |
| インベントリ                 | ”Test Ansible”を選択       |
| リポジトリ                   | "Test Ansible"を選択       |

右下の”作成”ボタンをクリックして登録します。

## status_check.ymlを手動実行する

さて、いよいよ実行です。

タスクテンプレートの画面に今回登録したテンプレート「Status Check test-vm」が表示されていると思います。

{% asset_img semaphore-template2.png 1024 alt %}

プレイボタン「▶️」をクリックすると当該Playbookが呼び出されます。新しいタスクというダイアログが表示されますので、実行をクリックしてください。

{% asset_img run-playbook1.png 1024 alt %}

さて、GUIからPlaybookが実行、確認できるようになりました。
最初が少し手間が掛かりますが、GUIによる管理ができるようになれば、過去の実行結果の把握などが容易になります。

## 改めて今回テストに使用したplaybook

前回の記事ではCLIベースでのAnsibleの実行、今回はSemaphoreUIによる実行を行いました。私の環境では、AIが作成してくれたため、必要なファイルについて補足しておきます。

前回記事で作成したのは、以下のフォルダ構成でした。フォルダの構成を作成するスクリプトも前回の記事に置いてあります。

```text
test-ansible/
├── ansible.cfg
├── inventories/
│   ├── group_vars/
│   ├── host_vars/
│   └── hosts.yml
├── playbooks/
└── roles/
```
そして、前回AIが作成してくれたファイルについて改めて記載します。

inventories/hosts.yml

``` yaml
all:
  children:
    ubuntu:
      hosts:
        test-vm:
          ansible_host: 192.168.xxx.42
```

playbooks/status_check.yml

``` yaml
---
- name: Check host status
  hosts: ubuntu
  gather_facts: true
  roles:
    - status_check
```

roles/status_check/defaults/main.yml

``` yaml
---
status_check_disk_mount: "/"
```

roles/status_check/tasks/main.yml

``` yaml
---
- name: Find target mount facts
  ansible.builtin.set_fact:
    status_check_root_mount: "{{ ansible_facts.mounts | selectattr('mount', 'equalto', status_check_disk_mount) | first }}"

- name: Calculate disk usage percentage
  ansible.builtin.set_fact:
    status_check_disk_usage_percent: >-
      {{ ((status_check_root_mount.size_total - status_check_root_mount.size_available)
      / status_check_root_mount.size_total * 100) | round(1) }}

- name: Display host status
  ansible.builtin.debug:
    msg:
      - "hostname : {{ ansible_facts.hostname }}"
      - "whoami   : {{ ansible_facts.user_id }}"
      - "uptime   : {{ (ansible_facts.uptime_seconds / 86400) | int }} days, {{ ((ansible_facts.uptime_seconds % 86400) / 3600) | int }} hours, {{ ((ansible_facts.uptime_seconds % 3600) / 60) | int }} min"
      - "memory   : {{ ansible_facts.memtotal_mb }} MB total / {{ ansible_facts.memfree_mb }} MB free"
      - "disk({{ status_check_disk_mount }}) : {{ status_check_disk_usage_percent }}% used ({{ (status_check_root_mount.size_total - status_check_root_mount.size_available) | filesizeformat }} / {{ status_check_root_mount.size_total | filesizeformat }})"
      - "ip address : {{ ansible_facts.default_ipv4.address | default('N/A') }}"
```

いかがでしょうか、ここまでの流れで、VS CodeとAIを使って作成したAnsibleコードをSemaphoreUIで動かせるようになりました。

## スケジュールを登録する

### TimeZoneの登録

`/etc/semaphore.config.json`を見ると以下のような構成になっていると思います。
``` json
cat config.json
{
 	"sqlite": {
 		"host": "/var/lib/semaphore/semaphore.db"
 	},
 	"dialect": "sqlite",
 	"tmp_path": "/opt/semaphore",
 	"cookie_hash": "xxxxx=",
 	"cookie_encryption": "xxxx=",
 	"access_key_encryption": "xxxx="
 }
```
ここにTimeZoneを設定します。jsonなので少しインデントなどに気をつけてもらって末尾から2行目にtimezoneの情報を加えて、以下のようにします。"access_key_encryption": "xxx="の後ろに、（カンマ）を入れて"schedule”からの3行を足します。

``` json
{
 	"sqlite": {
 		"host": "/var/lib/semaphore/semaphore.db"
 	},
 	"dialect": "sqlite",
 	"tmp_path": "/opt/semaphore",
 	"cookie_hash": "xxxxx=",
 	"cookie_encryption": "xxxx=",
 	"access_key_encryption": "xxxx=",
	"schedule": {
	"timezone": "Asia/Tokyo"
	}
} 
```

これはミスしやすいのでツールで確認しましょう。

``` json
sudo python3 -m json.tool /etc/semaphore/config.json >/dev/null \
  && echo "JSON OK"
```

その後、サービス再起動します。

``` bash
sudo systemctl restart semaphore
```

スケジュール編集画面で `Asia/Tokyo time` と表示されれば設定完了です。

{% asset_img semaphore-schedule.png 1024 alt %}

crontab -eでviで保守していくのはなかなか大変です。個人的な見解を述べさせていただくと、インフラやってる人はみんな嫌いだと思います笑。

上記のShow cron formatのトグルを外すと、以下のようにわかりやすくなります。これで登録しておけばわかりやすいです。

{% asset_img semaphore-schedule2.png 360 alt %}

ただし、このままだとジョブの終了時に通知が何も行われないので、結果がわかりません。ログインしてどうだったか確認できますが、こういったジョブスケジューラーというものはスケジューラーの設定をGUIで行い、その作業が終わったらログインしないのが一般的です。もちろんジョブが落ちたら中身を見ますが、それはログ中心だと思います。

メール通知でも良いのですが、実は私がセットアップした時には、このメール通知が内部エラーとなりうまく機能しませんでした。最新バージョンでは確認していませんが、過去のユーザーの声を見ても結構な数のレポートがあったので何らかの難しさがあるのでしょう。ここは時代ということもあり、Slackからの通知をやってみましょう。

## SlackのWebhookの作成

まず無料でアカウントを作成しましょう。ホームラボとして使う分には無料ユーザーの機能で十分多機能です。
`https://slack.com/`から右上の”ワークスペースを新規作成”でアカウントを作成しましょう。

アカウントが作成され、ワークスペースの設定が完了したら、ワークスペースの中で通知チャンネル（ハッシュタグ）を作成しておきます。

{% asset_img slack2.png 800 alt %}

私の例だと、チャンネルはHomelabに最適化されていて、目的ごとにチャンネルがありますが、ここでは通知を受けるためのチャンネルを作成しておきます。「チャンネルを追加する」から私のように#semaphoreと入れても良いですね。

続いてアプリの作成に進みます。

`https://api.slack.com/apps`

"Create New App"をクリックします。”From Scratch”を選びます。
その後、AppNameをたとえば、「Homelab」とし、最初に作成したワークスペースを指定します。

{% asset_img slack1.png 1024 alt %}

ここからWebhookの設定を行います。

{% asset_img slack3.png 1024 alt %}

まずはIncoming Webhookを有効にします。そのまま下にスクロールして、Add New Webhookをクリックします。

{% asset_img slack4.png 640 alt %}

これらの作業によって、チャンネルごとのWebhookが作成されます。今回はSemaphore向けですが、ProxmoxからもSlackのWebhookは指定できますので、通知が一元管理できます。私の例をご覧になるとお分かりかと思いますが、Semaphoreの通知、Ansible Playbookそのものからの通知、ProxmoxのBackup通知、または目的毎にパッチなどもチャンネル単位に分けています。最後のprotect/uniFiについては、UniFi Protect（監視カメラ）、UniFi(ネットワーク）からの通知を受けています（UniFiクラウド機能はOffにしてSlackで通知を一元管理）。

ここで登録したチャンネル毎のURLを”Copy”ボタンでクリップボードにコピーしておいてください。

## SlackのWebhookをSemaphoreUIに登録

さて、先ほどは、`/etc/semaphore.config.json`を編集しましたが、またこのファイルの編集が必要です。
今回は先ほど追加したTimezoneの上に2行足しましょう。先ほどクリップボードにコピーしたURLを"slack_url": の後に””で囲った上で貼り付けてください。

``` json
  "slack_alert": true,
  "slack_url": "https://hooks.slack.com/services/XXXXXXXXXXXX",
```

改めて、ツールで確認しましょう。

``` json
sudo python3 -m json.tool /etc/semaphore/config.json >/dev/null \
  && echo "JSON OK"
```

その後、サービス再起動します。

``` bash
sudo systemctl restart semaphore
```

もう一度登録したジョブを実行してみます。
今度はSlack通知が行われたログが表示されました。

``` text
7:49:43 PM
PLAY RECAP *********************************************************************
7:49:43 PM
test-vm                    : ok=4    changed=0    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0   
7:49:43 PM
7:49:43 PM
Attempting to send slack alert
7:49:44 PM
Sent successfully slack alert
```

私のスマホにはSlackをインストールしていますが、無事ジョブが正常終了したことが通知されました。

{% asset_img slack5.png 480 alt %}

## まとめ

さて、今回はAIを利用したAnsibleの実装にSlack通知まで進めたかったのですが、かなり長くなったのでここで一旦区切ります。
今回はSemaphoreUIのセットアップ、そしてSemaphoreからSlackへの通知までを行いました。
ただし、今回はAnsibleのジョブが正常終了したか異常終了したかだけの通知になります。実際にジョブの中でアラートが発生したり、何らかの警告や情報を通知したい場合はこれでは不足しています。つまり別のSlackのチャネルに何らかの付加情報を加えて、初めて運用の高度化が成り立ちます。次回はAnsibleのPlaybookの中で直接ユーザーに必要な情報をSlackに通知する方法をまとめたいと考えています。

今回はまだAnsibleの高度化はしていないので、UbuntuのVMの参照しか行っていませんが、最終的にはProxmoxに対して安全な操作を行うところまでを目的にしたいと考えてます。

前回と今回の記事でAIを使ってAnsibleの構築およびジョブの自動実行ができるようになり、Proxmoxの運用の高度化について、実現可能性が見えてきたと思います。今後の記事ではもう一歩先に進み、AIによるAnsibleの高度化についてまとめていきたいと考えてます。私の環境はProxmoxのクラスター構成であり、QdeviceにSemaphoreUIを配置し、Proxmoxクラスターの外のノードからProxmoxを操作していますが、必ずしもユーザー全てがそういう環境にはなく、むしろシングルノードのProxmoxユーザーが大半だと思われます。リスクのある破壊的操作を避けてProxmoxのパッチ情報の抽出などに取り組みたいと考えています。