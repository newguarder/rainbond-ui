import React from "react";
import { Link, Redirect, Switch, Route } from "dva/router";
import DocumentTitle from "react-document-title";
import { Icon } from "antd";
import { connect } from "dva";
import GlobalFooter from "../components/GlobalFooter";
import styles from "./UserLayout.less";
import logo from "../../public/logo.png";
import { getRoutes } from "../utils/utils";
import configureGlobal from "../utils/configureGlobal";
import cookie from "../utils/cookie";

const links = [
  {
    key: "help",
    title: "帮助",
    href: ""
  },
  {
    key: "privacy",
    title: "隐私",
    href: ""
  },
  {
    key: "terms",
    title: "条款",
    href: ""
  }
];

const copyright = configureGlobal.rainbondTextShow && (
  <div>
    Copyright
    <Icon type="copyright" />
    2018 好雨科技
  </div>
);

class UserLayout extends React.PureComponent {
  componentDidMount() {
    const load = document.getElementById("load");
    if (load) {
      document.body.removeChild(load);
    }
  }
  getPageTitle() {
    const { routerData, location, rainbondInfo } = this.props;
    const { pathname } = location;
    let title =
      (rainbondInfo &&
        rainbondInfo.title !== undefined &&
        rainbondInfo.title) ||
      "Rainbond is Serverless PaaS , A new generation of easy-to-use cloud management platforms based on kubernetes.";
    if (routerData[pathname] && routerData[pathname].name) {
      title = `${routerData[pathname].name} - ${title} `;
    }
    return title;
  }
  render() {
    const { routerData, match, rainbondInfo, nouse } = this.props;

    return (
      <DocumentTitle title={this.getPageTitle()}>
        <div className={styles.container}>
          <div className={styles.content}>
            {!nouse && (
              <div className={styles.top}>
                <div className={styles.header}>
                  <Link to="/">
                    {/* <img
                    style={{
                    verticalAlign: 'middle'
                  }}
                    alt="logo"
                    className={styles.logo}
                    src={rainbondInfo.logo || logo}/> */}
                    <h1
                      style={{
                        display: "inline-block",
                        verticalAlign: "middle",
                        marginBottom: 0
                      }}
                    >
                      {rainbondInfo.title}
                    </h1>
                  </Link>
                </div>
                <div className={styles.desc}>
                  无服务器PaaS、以应用为中心、软件定义一切
                </div>
              </div>
            )}
            <Switch>
              {getRoutes(match.path, routerData).map(item => (
                <Route
                  key={item.key}
                  path={item.path}
                  component={item.component}
                  exact={item.exact}
                />
              ))}
              <Redirect exact from="/user" to="/user/login" />
            </Switch>
          </div>
          <GlobalFooter links={links} copyright={copyright} />
        </div>
      </DocumentTitle>
    );
  }
}

export default connect(({ global }) => ({
  rainbondInfo: global.rainbondInfo,
  nouse: global.nouse
}))(UserLayout);
