#!/bin/bash                                                                                                                                                                                                   
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux                      
    sudo apt-key adv --keyserver keyserver.ubuntu.com --recv-key C99B11DEB97541F0
    sudo apt-add-repository https://cli.github.com/packages
    sudo apt update                                  
    sudo apt install gh
elif [[ "$OSTYPE" == "darwin"* ]]; then
    # Mac OSX
    brew install gh
else
    # Unknown.
    echo "Unknown operating system. This script supports Linux and Mac OSX."
    exit 1
fi
gh auth login
# Set the repository to fork
repo_to_fork="juspay/hyperswitch"

# Fork the repository
gh repo fork $repo_to_fork --clone=true --remote=true
payment_gateway=$1;
base_url=$1;
if [ -z "$payment_gateway" || -z "$base_url"] ; then
    echo "$RED Connector name or base url not present: try $GREEN\"sh raise_pr.sh adyen\""
    exit 1
fi
# git clone 
cd hyperswitch
sh scripts/add_connector.sh $1 $2
cp ~/Downloads/"$(ls -Art ~/Downloads | grep 'connector' | tail -n 1)" crates/router/src/connector/$1.rs
cp ~/Downloads/"$(ls -Art ~/Downloads | grep 'transformer' | tail -n 1)" crates/router/src/connector/$1/transformers.rs
echo "Showing all changed files"
git add .
git status
git commit -m "feat(connector): Add support for connector $1"
git push
echo "Successfully pushed to main branch. Please create a PR"
gh pr create --web
echo "Please check your browser to create a PR"