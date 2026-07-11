---
title: Proxmox運用にAnsibleとAIを活用する：Ansibleの始め方
date: 2026-07-11T10:55:32+09:00
tags: proxmox
categories:
 - AI
 - Ansible
---

{% asset_img Title.png 1024 alt %}

<p class="onepoint">この記事で実現すること</p>

前回の記事ではAnsibleの紹介、AIとを組み合わせて私が実現している内容を簡単に紹介しました。
今回は、Ansibleのセットアップから簡単なAnsible Playbookを作ってみます。

　- （前回記事）{% post_link ai-ansible %}

<!-- more -->

## 今回の環境

Proxmox配下で作成した新しいUbuntuのVM2つを使いAnsibleのセットアップとその操作を行っていきます。最終的にはProxmoxの操作も行えることを目標としたいので、その場合はProxmox配下ではない他のベアメタルのノードがおすすめです。私の場合は、Proxmoxは2ノードクラスター環境なので、QuorumとしてのqdeviceにAnsibleの環境を構築しています(開発はVMで行いGitHub経由でqdevice側に取り込んでいます)。この記事ではあくまでAnsibleの初期的な動作確認のためにテストVMで確認をしていきます。

- test-ansible：Ansible実行サーバー
- test-vm：操作対象Ubuntu

Cloud-Initがあると、こういったテスト時にもほんの1分程度でVMが作成できます。{% post_link Proxmox-Cloud-Init %}の記事も参考にしてみてください。

目的はtest-ansibleノードにAnsibleを構成し、test-vmに対してリモートで目的のコマンドを実行することまでとします。

## 準備

test-ansibleノードにSSHした後、まずモジュール群を最新にしておきます。

``` bash
sudo apt update
sudo apt full-upgrade -y
sudo reboot
```

test-ansibleで、ansibleとgitとをインストールします
``` bash
sudo apt install ansible git -y
```


確認

``` bash
ansible --version
git --version
```

期待値

``` bash
ansible --version
git --version
ansible [core 2.20.1]
  config file = None
  configured module search path = ...
  ansible python module location = ...
  ansible collection location = ...
  executable location = ...
  python version = 3.14.4 ...
  jinja version = 3.1.6
  pyyaml version = 6.0.3 ...
git version 2.53.0
```

まだconfigも無いので上記のような表記になります。gitは必須ではありませんが、AIを使ってAnsibleを構成していくため、いつでも戻せる準備をしておく必要があり、gitは実質的に必要と考えてください。

## Git初期化
まずはAnsible用の作業ディレクトリを作成します。今回は `test-ansible` という名前にしました。

``` bash
mkdir test-ansible
cd test-ansible

git init
git branch -m main
git branch --show-current
```

Gitは必須ではありません。AnsibleだけであればGitがなくても動作します。
ただし、AIにコードを書いてもらう場合は、意図しない変更や修正が入ることがあります。そのため、いつでも元に戻せるよう、最初からGitで管理することをおすすめします。さらに、GitHubを使いリポジトリを設定いただく方がお勧めです。GitHubからのCloneは公開鍵認証等が必要となり、説明が長くなってしまいますので、この例ではGitHub連携は省略します。

## ディレクトリ構成作成

まずはホームディレクトリにAnsible用の作業ディレクトリを作成します。

```bash
cd ~

mkdir -p test-ansible/{inventories,playbooks,roles}
mkdir -p test-ansible/inventories/group_vars
mkdir -p test-ansible/inventories/host_vars

cd test-ansible

touch ansible.cfg
touch inventories/hosts.yml
```

以下のようなディレクトリ構成になります。

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

確認のため、以下を実行してください。
``` bash
ls -R
```

このフォルダ構成がAnsibleでは最低限の初期構成です。

## VS Code

今回の例では、（これは説明不要ですが）Microsoft社製のVS Codeで開発していきます。

- Download Visual Studio Code
 <https://code.visualstudio.com/download>

さて、VS Codeを起動して、UnbuntuにSSHするための拡張機能をインストールします。

VS CodeからSSHするための拡張機能です。Microsoft社が提供していることを確認の上、インストールしてください。
{% asset_img vscode1.png 480 alt %}

その後、拡張機能からansibleのHostにSSHします。そしてtest-ansibleのフォルダを開きます。

{% asset_img vscode2.png 1024 alt %}

これで、ansibleフォルダ構成はVS Codeから見えるようになりました。

次は、AIです。ここではClaude Code for VS CodeまたはCodex - OpenAI's coding agentを使います。前回の記事にも書きましたが、これらのAIを使うには、実質的に有償の契約が必要となります。CodexはOPEN AI(chatGPT)、ClaudeCodeについてはAnthropicのサイトをご確認ください。拡張機能については、こちらも提供元をしっかりと確認の上インストールしてください。

こちらは、ClaudeCodeの例です。サブスクリプションの確認があるのでログインする必要があります。

{% asset_img vscode3.png 1024 alt %}

ブラウザを開き、メールアドレスで認証後、セッション情報をブラウザからコピーして、再び、VS Code上のClaude Code拡張機能に貼り付けるとClaude Codeが使えるようになります。挨拶してみます、ちゃんと使えますね。

{% asset_img vscode4.png 1024 alt %}

さて、続いてClaude Code(CC)と会話してAnsible環境のテストをやっていきます。

## AIと対話しAnsible環境を構築する　- Claude Code

CCの入力ボックスに以下を投入します。

``` text
このディレクトリはAnsibleの学習用リポジトリです。

ディレクトリ構成は以下を使用します。

- inventories
- playbooks
- roles

まずは最小構成のAnsible環境を作成してください。

作成対象
- ansible.cfg
- inventories/hosts.yml

対象はUbuntu Serverです。

操作元サーバー
- ホスト名: test-ansible
- IPアドレス: 192.168.xxx.41

操作先サーバー
- ホスト名: test-vm
- IPアドレス: 192.168.xxx.42

現在は /etc/hosts に何も登録されていません。

まず何を準備すべきかを順番に説明し、その後に必要なファイルを作成してください。
```

{% asset_img cc1.png 360 alt %}

早速返してくれました。説明が不十分でも、SSHするとわかっているようですね。
次は、鍵をどうするか聞かれました。私の普段の環境では、専用鍵を使い、普段の操作用の鍵とは分けていますが、このテンポラリ環境では簡単にするために、インストール時に指定したユーザーのデフォルト鍵を使う方針でいきたいと思います。

{% asset_img cc2.png 360 alt %}

ですが、まだtest-ansibleには秘密鍵を1つも登録していませんでしたので、CCはansibleユーザーでやるよと言ってくれてます。まぁ、任せましょう。以下はCCの返答です。

``` text
準備すべきこと（順番）
/etc/hosts の名前解決（任意ですが学習用に推奨）
操作元(test-ansible)から test-vm という名前で疎通できるよう、/etc/hosts に以下を追記します。


192.168.xxx.42 test-vm
※IPを直接インベントリに書く方法でも動きますが、ホスト名運用に慣れる意味で追記をおすすめします。

SSH鍵の準備
~/.ssh/ に秘密鍵が見当たりませんでした。Ansibleは基本SSH経由で操作先に接続するため、鍵ペアの作成と test-vm への公開鍵配布（ssh-copy-idなど）が必要です。

操作先(test-vm)側の準備

Ubuntu Serverに管理用ユーザーを作成し、SSH公開鍵を配置
Python3がインストールされていること（Ansibleモジュール実行に必要。Ubuntu Serverなら通常デフォルトで入っています）
必要に応じてパスワードなしsudo設定（/etc/sudoers.d/）
疎通確認
ansible test-vm -m ping が通ることを確認

ansible.cfg とインベントリの作成（今回作成するもの）

inventories/hosts.yml にホスト・グループ定義
ansible.cfg でインベントリパスやSSH設定などのデフォルトを指定
まずはファイルを作成します。SSH接続ユーザー名について確認させてください。
```

``` text
AskUserQuestion

CC：Your questions have been answered: "test-vm へSSH接続する際のユーザー名は何を使いますか？

→私の回答:ansible, 

CC：operator用の秘密鍵のパスや設定方針は？
→私の回答:デフォルトのSSHエージェント/鍵を使う
```

ここで進んで良いか考え直すかをYesかNoの確認ダイアログを出して確認してきます。任せましょう。

ansible.cfgの中身も作ってくれました。
``` text
[defaults]
inventory = inventories/hosts.yml
remote_user = ansible
roles_path = roles
host_key_checking = False
interpreter_python = auto_silent

[privilege_escalation]
become = True
become_method = sudo
```

「※IPを直接インベントリに書く方法でも動きますが、ホスト名運用に慣れる意味で追記をおすすめします。」と言ってくれてます。今はUbuntuのデフォルトユーザーなので、/etc/hostsはsudoでないと編集できません。従い、以下の案内をしてくれます。

- 「SSH接続ユーザーは ansible、鍵はデフォルトのSSHエージェント/鍵を使う方針で進めます。ファイルを作成します。」
- 「/etc/hosts への追記（test-ansible側）192.168.xxx.42 test-vm
これは私からは編集できません（システムファイルの変更のため）。実行してよければコマンドをお伝えします。」

いいですね、sudoのためのパスワードを聞いてくるようなことはしません。

/etc/hostsを作ったよとCCに伝えたところ、以下の返答です。

``` text
test-vm への名前解決・疎通ともにOKです。SSH鍵ペアはまだ無いので作成します。

Bash Generate a new ed25519 SSH key pair with no passphrase
IN
ssh-keygen -t ed25519 -C "yoshi@test-ansible" -f ~/.ssh/id_ed25519 -N ""

OUT
Generating public/private ed25519 key pair.
Your identification has been saved in /home/yoshi/.ssh/id_ed25519
Your public key has been saved in /home/yoshi/.ssh/id_ed25519.pub
The key fingerprint is:
SHA256:sP2ZXGBwMZQ/3E8FgnAsdEYBBrneggvvL8qC/fJGpSY yoshi@test-ansible
The key's randomart image is:
+--[ED25519 256]--+
|      .+**@=. .. |
|      ...*+. .  .|
|      .. .oo .  .|
|      o+ . .+ . .|
|     =..S   .. o |
|  E = o .o +    .|
|.. * . .  =      |
|o.o =            |
| .oB+o.          |
+----[SHA256]-----+
SSH鍵ペアを作成しました（パスフレーズなし・ed25519）。
```

いや本当に楽ですね。ほとんどやってくれてます。。。
ここまでほとんど自分では調べていません。AIが不足している前提条件を確認し、必要な作業を順番に提示してくれます。私は「Yes」「No」の判断と、sudoが必要な箇所だけを実行しています。まさにAIと対話しながら環境を組み立てている感覚です。

途中の操作は省略しますが、test-ansibleからtest-vmに接続できるように、上記でCCが作成してくれたyoshi@test-ansibleの公開鍵が`/home/yoshi/.ssh/id_ed25519`にあるので、それをcatしてから公開鍵を選択してクリップボードにコピー、再び、test-vmに自分でSSHログインし、この公開鍵を/home/yoshi/.ssh/のauthorized_keysに追記します(フツーにviで開いてクリップボードからPasteして保存します)。

ちなみに、CCはこう説明してくれてます。

``` text
test-vmのコンソールで yoshi ユーザーとしてログインし、以下を実行してください（~/.ssh/authorized_keys が無ければ作成されます）。

mkdir -p ~/.ssh && chmod 700 ~/.ssh
echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIP9kvGi45S9TvYNwddS77GqOWXIl/q8q7Og6qqnMOCMx yoshi@test-ansible" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
追加できたら教えてください。
```

これは公開鍵認証を知らなくても十分に対応できますね。本当に親切です。

鍵を追記したことをCCに伝えて、次はCCから以下の回答です。
``` text
SSH接続成功しました。次に test-vm 上で ansible ユーザーを作成し、専用鍵とパスワードなしsudoを設定します。まず yoshi にsudo権限があるか確認します。
```

そして、実際にユーザーyoshiはsudo権限があるので、サクサクと進めていってくれました。
``` bash
ssh yoshi@test-vm "sudo -n true && echo 'passwordless sudo OK' || echo 'needs password'"
> passwordless sudo OK

ssh yoshi@test-vm 'sudo useradd -m -s /bin/bash ansible 2>&1 || echo "user may already exist"; id ansible'

> uid=1002(ansible) gid=1002(ansible) groups=1002(ansible)

PUBKEY=$(cat ~/.ssh/id_ed25519.pub)
ssh yoshi@test-vm "sudo mkdir -p /home/ansible/.ssh && \
  echo '$PUBKEY' | sudo tee /home/ansible/.ssh/authorized_keys > /dev/null && \
  sudo chown -R ansible:ansible /home/ansible/.ssh && \
  sudo chmod 700 /home/ansible/.ssh && \
  sudo chmod 600 /home/ansible/.ssh/authorized_keys && \
  echo 'ansible ALL=(ALL) NOPASSWD:ALL' | sudo tee /etc/sudoers.d/ansible > /dev/null && \
  sudo chmod 440 /etc/sudoers.d/ansible && \
  sudo visudo -cf /etc/sudoers.d/ansible"

>/etc/sudoers.d/ansible: parsed OK

```
そして、肝となる場所でコマンドを表示し、再び実行してよいかYes or Noのダイアログを表示します。

``` bash
ssh -o BatchMode=yes -o ConnectTimeout=5 ansible@test-vm "whoami && sudo -n whoami"
```

もう結果は見えていますが、私はほぼYesに応答しながらここまで進みます。

``` text
>ansible
>root
```

期待通りです。Ansibleは操作先のホストでsudoなど管理者権限のコマンドを投入することも多いです。最終的にはAnsible経由でProxmoxの操作、クラスター操作をすることになります。つまりsudoすることが当たり前のようにあります。これをAnsibleの世界では、becomeと言います。

私、本当に正直に言うと、Ansibleで接続してbecomeしてwhoamiが実例としてちょうどいいかなと思ってたんですが、Ansibleでやる前のテストで実際にCCに実現されてしまいました。。。

そして、CCは続けてAnsible経由で、最初の一歩、Ansibleの世界のHello Worldに相当する、Ansible Pingを実行します。

``` text
ansible test-vm -m ping
>test-vm | SUCCESS => {
    "ansible_facts": {
        "discovered_interpreter_python": "/usr/bin/python3.14"
    },
    "changed": false,
    "ping": "pong"
}

```

最後に、CCはまとめとして、以下を説明してくれました。
``` text
まとめ
作成・設定したもの

ansible.cfg — インベントリパス、remote_user=ansible、sudo昇格設定
inventories/hosts.yml — ubuntu グループに test-vm(192.168.xxx.42)を登録
/etc/hosts への test-vm 登録（ユーザー実施済み）
SSH鍵ペア ~/.ssh/id_ed25519（test-ansible側、パスフレーズなし）
test-vm側に ansible ユーザーを新規作成し、公開鍵登録・パスワードなしsudo(/etc/sudoers.d/ansible)を設定
次にできること

playbooks/ に最初のPlaybook（例: パッケージ更新やユーザー管理）を作成
roles/ を使った構成の分割
inventories/group_vars/ubuntu.yml に共通変数を定義
何か作りたいPlaybookやRoleがあれば教えてください。
```

私、ブログに何かを書く必要があるんでしょうか。。。。もうこの記事は終わりでいいでしょうか。。。

さて、そうはいっても、Ansibleらしいものを作ってもらいましょう。
``` text
test-vmの状態確認Playbookを作ってください。

取得する項目は

・hostname
・whoami
・uptime
・メモリ容量
・ディスク使用率
・IPアドレス

可能な限りAnsibleのmoduleやFactsを利用してください。

roles配下へ配置してください。
```

Ansibleの既存モジュールを使うことで省力化が図れます。この辺りはあまり拘らずにAIに任せた方が良いかと思います。
さて、10回くらい、「Yes」をクリックしたでしょうか？時間にして2、3分程度ですが、以下の出力をしてくれました。

``` text
正常に動作しました。

作成したもの
roles/status_check/tasks/main.yml — 状態確認のタスク本体
roles/status_check/defaults/main.yml — チェック対象マウントポイント（デフォルト /）
playbooks/status_check.yml — ubuntu グループに対して実行するPlaybook
実行結果


hostname : ubuntu
whoami   : root
uptime   : 0 days, 4 hours, 34 min
memory   : 1895 MB total / 1293 MB free
disk(/)  : 21.3% used (2.7 GB / 12.8 GB)
ip address : 192.168.xxx.42
利用したFacts（すべて標準の setup モジュールが自動収集、追加コレクション不要）

ansible_facts.hostname
ansible_facts.user_id（Ansibleが実行しているユーザー。become=Trueのためroot）
ansible_facts.uptime_seconds
ansible_facts.memtotal_mb / memfree_mb
ansible_facts.mounts（/ のsize_total / size_availableから使用率を算出）
ansible_facts.default_ipv4.address
whoami は become により root として表示されています。ansible 接続ユーザー自体を見たい場合は ansible_facts.env.SUDO_USER や ansible_user 変数を使う方法もありますが、必要であれば調整します。
```

実際に、コマンドラインから手動実行するには、以下のように実行します。
`ansible-playbook playbooks/status_check.yml`

実行結果：
``` text
PLAY [Check host status] *******************************************************

TASK [Gathering Facts] *********************************************************
ok: [test-vm]

TASK [status_check : Find target mount facts] **********************************
ok: [test-vm]

TASK [status_check : Calculate disk usage percentage] **************************
ok: [test-vm]

TASK [status_check : Display host status] **************************************
ok: [test-vm] => {
    "msg": [
        "hostname : ubuntu",
        "whoami   : root",
        "uptime   : 0 days, 4 hours, 38 min",
        "memory   : 1895 MB total / 1300 MB free",
        "disk(/) : 21.4% used (2.7 GB / 12.8 GB)",
        "ip address : 192.168.xxx.42"
    ]
}

PLAY RECAP *********************************************************************
test-vm                    : ok=4    changed=0    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
```

PLAY RECAP、failed=0,skipped=0とかの表示形式はAnsible特有の表示の仕方です。

## 実際のPlaybook

今回は、基本機能だけで実現できているので、実装したシェルなどのコードはありません。先ほど作成してくれたplaybooksの中身は以下です。
``` text
status_check.yml
---
- name: Check host status
  hosts: ubuntu
  gather_facts: true
  roles:
    - status_check
```

そして、このplaybooksからはroles/status_check/tasks/main.ymlが呼ばれます。見てなんとなくわかると思いますが、Ansibleの良いところはなんとなく眺めていて、「あ、なんとなくこういう処理やってるんだな」と言うレベルでわかることがメリットです。

``` text
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

なかなか個人の環境でこういったコードを書くのは面倒でやろうという気になりませんでしたが、AI時代は本当に簡単に実現できます。正直難解なコマンドがわかっていなくても、AIを活用することで、ProxmoxのVMのライブマイグレーションなども実現できます。

## コードの保存とCommit

実装してもらったコードは最後Commitしておきましょう。細かくコミットしておけば何か壊してしまった時でもAIにお願いすればロールバックしてくれます。

事前にTerminalで以下を設定してください。
``` bash
git config --global user.name "your name"
git config --global user.email your-email-address
```
{% asset_img vscode5.png 1024 alt %}

## まとめ

今回の簡単な事例でAIを使ってAnsibleを構築するイメージについて理解いただけたと思います。まずはお持ちの環境でVMのヘルスチェックなど情報収集から始められることをお勧めします。前回の記事で書いた通り、私はさまざまなバッチ処理を作成し決められた時間に実行するようにしています。

Ansibleだけでは決められた時間に実行することはできず、Linuxの基本機能だとCronまたはSystemd Timerを使うことになります。しかしそれでは保守性として不十分ですのでGUIを使います。私のお勧めはSemaphoreUIです。次回はこれらにタスクを登録し、日次、週次、月次で実行するものの概要を説明し、またジョブ通知（Slack）に関しても書いてみたいと思います。

{% asset_img semaphore.png 1024 alt %}


スマホから見た場合も完全ではないですが、レスポンシブ対応（と言えなくもない程度）なので、外出中であっても、スマホからVPN接続してから、サービスの再起動、VMのリスタート、ジョブの再実行などが行えます。

{% asset_img semaphore2.png 360 alt %}
