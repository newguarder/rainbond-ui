import { createElement } from "react";
import dynamic from "dva/dynamic";
import pathToRegexp from "path-to-regexp";
import { getMenuData } from "./menu";

let routerDataCache;

const modelNotExisted = (app, model) =>
  !app._models.some(
    ({ namespace }) => namespace === model.substring(model.lastIndexOf("/") + 1)
  );

// wrapper of dynamic
const dynamicWrapper = (app, models, component) => {
  // () => require('module') transformed by babel-plugin-dynamic-import-node-sync
  if (component.toString().indexOf(".then(") < 0) {
    models.forEach(model => {
      if (modelNotExisted(app, model)) {
        // eslint-disable-next-line
        app.model(require(`../models/${model}`).default);
      }
    });
    return props => {
      if (!routerDataCache) {
        routerDataCache = getRouterData(app);
      }
      return createElement(component().default, {
        ...props,
        routerData: routerDataCache
      });
    };
  }
  // () => import('module')
  return dynamic({
    app,
    models: () =>
      models
        .filter(model => modelNotExisted(app, model))
        .map(m => import(`../models/${m}.js`)),
    // add routerData prop
    component: () => {
      if (!routerDataCache) {
        routerDataCache = getRouterData(app);
      }
      return component().then(raw => {
        const Component = raw.default || raw;
        return props =>
          createElement(Component, {
            ...props,
            routerData: routerDataCache
          });
      });
    }
  });
};

function getFlatMenuData(menus) {
  let keys = {};
  menus.forEach(item => {
    if (item.children) {
      keys[item.path] = {
        ...item
      };
      keys = {
        ...keys,
        ...getFlatMenuData(item.children)
      };
    } else {
      keys[item.path] = {
        ...item
      };
    }
  });
  return keys;
}

export const getRouterData = app => {
  const routerConfig = {
    "/": {
      component: dynamicWrapper(
        app,
        [
          "user",
          "appControl",
          "createApp",
          "teamControl",
          "plugin",
          "region",
          "market"
        ],
        () => import("../layouts/BasicLayout")
      )
    },
    "/team/:team/region/:region/source/:type?/:name?": {
      component: dynamicWrapper(app, ["index"], () =>
        import("../routes/Source/Index")
      )
    },
    "/team/:team/region/:region/finance": {
      component: dynamicWrapper(app, ["index"], () =>
        import("../routes/Finance")
      )
    },
    "/team/:team/region/:region/resources/buy/:regionName": {
      component: dynamicWrapper(app, [], () =>
        import("../routes/Finance/resources")
      )
    },
    "/team/:team/region/:region/index": {
      component: dynamicWrapper(app, ["index"], () =>
        import("../routes/Index/Index")
      )
    },
    "/team/:team/region/:region/message": {
      component: dynamicWrapper(app, ["index"], () =>
        import("../routes/Message/Index")
      )
    },
    "/team/:team/region/:region/allbackup": {
      component: dynamicWrapper(app, ["groupControl"], () =>
        import("../routes/Group/AllBackup")
      )
    },
    "/team/:team/region/:region/team": {
      component: dynamicWrapper(app, ["teamControl"], () =>
        import("../routes/Team")
      )
    },
    "/team/:team/region/:region/groups/upgrade/:groupId/": {
      component: dynamicWrapper(app, ["groupControl"], () =>
        import("../routes/Upgrade")
      ),
      title: "云市应用升级"
    },
    "/team/:team/region/:region/groups/backup/:groupId/": {
      component: dynamicWrapper(app, ["groupControl"], () =>
        import("../routes/Group/Backup")
      ),
      title: "备份管理"
    },
    "/team/:team/region/:region/groups/:groupId": {
      component: dynamicWrapper(app, ["groupControl"], () =>
        import("../routes/Group/Index")
      )
    },

    "/team/:team/region/:region/groups/share/one/:groupId/:shareId": {
      component: dynamicWrapper(app, ["groupControl"], () =>
        import("../routes/Group/AppShare")
      )
    },
    "/team/:team/region/:region/groups/share/two/:groupId/:shareId": {
      component: dynamicWrapper(app, ["groupControl"], () =>
        import("../routes/Group/AppShareLoading")
      )
    },
    "/team/:team/region/:region/groups/share/three/:groupId:ShareId": {
      component: dynamicWrapper(app, ["groupControl"], () =>
        import("../routes/Group/AppShareFinish")
      )
    },
    "/team/:team/region/:region/app/:appAlias/:type?": {
      component: dynamicWrapper(app, ["appDetail", "appControl"], () =>
        import("../routes/App")
      )
    },
    "/team/:team/region/:region/create/code/:type?/:code?": {
      component: dynamicWrapper(app, [], () => import("../routes/Create/code"))
    },
    "/team/:team/region/:region/create/outer/:type?/:outer?": {
      component: dynamicWrapper(app, [], () => import("../routes/Create/outer"))
    },
    "/team/:team/region/:region/create/market/:keyword?": {
      component: dynamicWrapper(app, [], () =>
        import("../routes/Create/market")
      )
    },
    "/team/:team/region/:region/myplugns/:pluginId?": {
      component: dynamicWrapper(app, [], () => import("../routes/Plugin"))
    },
    "/team/:team/region/:region/shareplugin/step-one/:pluginId/:shareId": {
      component: dynamicWrapper(app, [], () =>
        import("../routes/Plugin/share-stepone")
      )
    },
    "/team/:team/region/:region/shareplugin/step-two/:pluginId/:shareId": {
      component: dynamicWrapper(app, [], () =>
        import("../routes/Plugin/share-steptwo")
      )
    },
    "/team/:team/region/:region/create-plugin": {
      component: dynamicWrapper(app, [], () =>
        import("../routes/Plugin/Create")
      )
    },
    "/team/:team/region/:region/create/create-check/:appAlias": {
      component: dynamicWrapper(app, [], () =>
        import("../routes/Create/create-check")
      )
    },
    "/team/:team/region/:region/create/create-compose-check/:groupId/:composeId": {
      component: dynamicWrapper(app, [], () =>
        import("../routes/Create/create-compose-check")
      )
    },
    "/team/:team/region/:region/create/image/:type?/:image?": {
      component: dynamicWrapper(app, [], () =>
        import("../routes/Create/image")
      ),
      name: ""
    },
    "/team/:team/region/:region/create/create-setting/:appAlias": {
      component: dynamicWrapper(app, [], () =>
        import("../routes/Create/create-setting")
      )
    },
    "/team/:team/region/:region/create/create-moreService/:appAlias/:check_uuid": {
      component: dynamicWrapper(app, [], () =>
        import("../routes/Create/create-moreService")
      )
    },
    "/team/:team/region/:region/guide": {
      component: dynamicWrapper(app, ["index"], () =>
        import("../routes/Guide/index")
      )
    },
    "/team/:team/region/:region/create/create-compose-setting/:groupId/:composeId": {
      component: dynamicWrapper(app, [], () =>
        import("../routes/Create/create-compose-setting")
      )
    },
    "/team/:team/region/:region/result/success": {
      component: dynamicWrapper(app, [], () =>
        import("../routes/Result/Success")
      )
    },
    "/result/fail": {
      component: dynamicWrapper(app, [], () => import("../routes/Result/Error"))
    },



    "/team/:team/region/:region/exception/403": {
      component: dynamicWrapper(app, [], () =>
        import("../routes/Exception/403")
      )
    },
    "/team/:team/region/:region/exception/404": {
      component: dynamicWrapper(app, [], () =>
        import("../routes/Exception/404")
      )
    },
    "/team/:team/region/:region/exception/500": {
      component: dynamicWrapper(app, [], () =>
        import("../routes/Exception/500")
      )
    },
    "/team/:team/region/:region/gateway/control/:types?/:isopen?": {
      component: dynamicWrapper(app, ["gateWay", "appControl"], () =>
        import("../routes/GateWay/control")
      )
    },
    "/team/:team/region/:region/gateway/license": {
      component: dynamicWrapper(app, ["gateWay", "appControl"], () =>
        import("../routes/GateWay/license")
      )
    },
    "/exception/trigger": {
      component: dynamicWrapper(app, ["error"], () =>
        import("../routes/Exception/triggerException")
      )
    },

    "/user": {
      component: dynamicWrapper(app, ["user"], () =>
        import("../layouts/UserLayout")
      )
    },
    "_/user/login": {
      component: dynamicWrapper(app, ["user"], () =>
        import("../routes/User/Login")
      ),
      name: "登录"
    },
    get "/user/login"() {
      return this["_/user/login"];
    },
    set "/user/login"(value) {
      this["_/user/login"] = value;
    },
    "/user/register": {
      component: dynamicWrapper(app, ["user"], () =>
        import("../routes/User/Register")
      ),
      name: "注册"
    },
    "/user/register-result": {
      component: dynamicWrapper(app, [], () =>
        import("../routes/User/RegisterResult")
      )
    }
    // '/user/:id': {   component: dynamicWrapper(app, [], () =>
    // import('../routes/User/SomeComponent')), },
  };
  // Get name from ./menu.js or just set it in the router data.
  const menuData = getFlatMenuData(getMenuData());

  // Route configuration data eg. {name,authority ...routerConfig }
  const routerData = {};
  // The route matches the menu
  Object.keys(routerConfig).forEach(path => {
    // Regular match item name eg.  router /user/:id === /user/chen
    const pathRegexp = pathToRegexp(path);
    const menuKey = Object.keys(menuData).find(key =>
      pathRegexp.test(`/${key}`)
    );
    let menuItem = {};
    // If menuKey is not empty
    if (menuKey) {
      menuItem = menuData[menuKey];
    }
    let router = routerConfig[path];
    // If you need to configure complex parameter routing,
    // https://github.com/ant-design/ant-design-pro-site/blob/master/docs/router-and
    // -
    // nav.md#%E5%B8%A6%E5%8F%82%E6%95%B0%E7%9A%84%E8%B7%AF%E7%94%B1%E8%8F%9C%E5%8D%
    // 9 5 eg . /list/:type/user/info/:id
    router = {
      ...router,
      name: router.name || menuItem.name,
      authority: router.authority || menuItem.authority
    };
    routerData[path] = router;
  });
  return routerData;
};
