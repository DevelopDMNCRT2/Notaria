import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to, from, savedPosition) {
    return savedPosition || { left: 0, top: 0 }
  },
  routes: [
    {
      path: '/',
      redirect: '/almacen'
    },
    {
      path: '/calendar',
      name: 'Calendar',
      component: () => import('../views/Others/Calendar.vue'),
      meta: {
        title: 'Calendar',
      },
    },
    {
      path: '/profile',
      name: 'Profile',
      component: () => import('../views/Others/UserProfile.vue'),
      meta: {
        title: 'Profile',
      },
    },
    {
      path: '/usuarios',
      name: 'Usuarios',
      component: () => import('../views/Usuarios.vue'),
      meta: {
        title: 'Usuarios',
        requiresAdmin: true,
      },
    },
    {
      path: '/almacen',
      name: 'Almacen',
      component: () => import('../views/Almacen.vue'),
      meta: {
        title: 'Almacen',
        requiresAdmin: true,
      },
    },
    {
      path: '/archivos',
      name: 'Archivos',
      component: () => import('../views/Archivos.vue'),
      meta: {
        title: 'Archivos',
        requiresAdmin: true,
      },
    },
    {
      path: '/citas',
      name: 'Citas',
      component: () => import('../views/Citas.vue'),
      meta: {
        title: 'Citas',
      },
    },
    {
      path: '/solicitudes',
      name: 'Solicitudes',
      component: () => import('../views/Solicitudes.vue'),
      meta: {
        title: 'Solicitudes',
      },
    },
    {
      path: '/form-elements',
      name: 'Form Elements',
      component: () => import('../views/Forms/FormElements.vue'),
      meta: {
        title: 'Form Elements',
      },
    },
    {
      path: '/basic-tables',
      name: 'Basic Tables',
      component: () => import('../views/Tables/BasicTables.vue'),
      meta: {
        title: 'Basic Tables',
      },
    },
    {
      path: '/line-chart',
      name: 'Line Chart',
      component: () => import('../views/Chart/LineChart/LineChart.vue'),
    },
    {
      path: '/bar-chart',
      name: 'Bar Chart',
      component: () => import('../views/Chart/BarChart/BarChart.vue'),
    },
    {
      path: '/alerts',
      name: 'Alerts',
      component: () => import('../views/UiElements/Alerts.vue'),
      meta: {
        title: 'Alerts',
      },
    },
    {
      path: '/avatars',
      name: 'Avatars',
      component: () => import('../views/UiElements/Avatars.vue'),
      meta: {
        title: 'Avatars',
      },
    },
    {
      path: '/badge',
      name: 'Badge',
      component: () => import('../views/UiElements/Badges.vue'),
      meta: {
        title: 'Badge',
      },
    },

    {
      path: '/buttons',
      name: 'Buttons',
      component: () => import('../views/UiElements/Buttons.vue'),
      meta: {
        title: 'Buttons',
      },
    },

    {
      path: '/images',
      name: 'Images',
      component: () => import('../views/UiElements/Images.vue'),
      meta: {
        title: 'Images',
      },
    },
    {
      path: '/videos',
      name: 'Videos',
      component: () => import('../views/UiElements/Videos.vue'),
      meta: {
        title: 'Videos',
      },
    },
    {
      path: '/blank',
      name: 'Blank',
      component: () => import('../views/Pages/BlankPage.vue'),
      meta: {
        title: 'Blank',
      },
    },

    {
      path: '/error-404',
      name: '404 Error',
      component: () => import('../views/Errors/FourZeroFour.vue'),
      meta: {
        title: '404 Error',
      },
    },

    {
      path: '/signin',
      name: 'Signin',
      component: () => import('../views/Auth/Signin.vue'),
      meta: {
        title: 'Signin',
      },
    },
    {
      path: '/signup',
      name: 'Signup',
      component: () => import('../views/Auth/Signup.vue'),
      meta: {
        title: 'Signup',
      },
    },
  ],
})

// Rutas que NO requieren autenticación
const publicRoutes = ['Signin', 'Signup', '404 Error']

// Rol que NO puede ver rutas restringidas
const RESTRICTED_ROLE = 'Operativo'

router.beforeEach((to, from, next) => {
  document.title = `Notaria-Admin | ${to.meta.title || to.name}`

  const isPublic = publicRoutes.includes(to.name as string)
  const rawUser = localStorage.getItem('notaria_user')
  const isLoggedIn = !!rawUser

  if (!isPublic && !isLoggedIn) {
    return next({ name: 'Signin' })
  }

  if (to.name === 'Signin' && isLoggedIn) {
    return next({ path: '/citas' })
  }

  // Bloquear rutas restringidas para el rol Operativo
  if (to.meta.requiresAdmin && isLoggedIn) {
    const user = JSON.parse(rawUser!)
    if (user.rol === RESTRICTED_ROLE) {
      return next({ path: '/citas' })
    }
  }

  next()
})

export default router
